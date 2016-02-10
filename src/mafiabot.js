'use strict';
/**
 * Mafiabot plugin
 *
 * Helps run mafia games, providing features such as vote tracking and listing.
 *
 * @module mafiabot
 * @author Accalia, Dreikin, Yamikuronue
 * @license MIT
 */

// Requisites

const dao = require('./dao.js');
const modController = require('./mod_controller');
const playerController = require('./player_controller');
const view = require('./view');
const Promise = require('bluebird');
const readFile = require('fs-readfile-promise');
const Handlebars = require('handlebars');
const validator = require('./validator');
Handlebars.registerHelper('voteChart', require('./templates/helpers/voteChart'));
Handlebars.registerHelper('listNames', require('./templates/helpers/listNames'));

// Constants

const unvoteNicks = ['unvote', 'no-lynch', 'nolynch'];

const internals = {
	browser: null,
	configuration: exports.defaultConfig,
	timeouts: {},
	interval: null,
	events: null
};
exports.internals = internals;

// Local extensions
/*eslint-disable no-extend-native*/
Array.prototype.contains = function(element){
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/

// Defaults

/**
 * Default plugin configuration
 */
exports.defaultConfig = {
	/**
	 * Required delay before posting another reply in the same topic.
	 *
	 * @default
	 * @type {Number}
	 */
	cooldown: 0 * 1000,
	/**
	 * Messages to select reply from.
	 *
	 * @default
	 * @type {string[]}
	 */
	messages: [
		'Command invalid or no command issued. Try the `help` command.'
	],
	/**
	 * File location for database.
	 *
	 * @default
	 * @type {string}
	 */
	db: './mafiadb'
};

// Helper functions
// 

function patchIn(module) {
	for (const property in module) {
		if (typeof property === 'function' && module.hasOwnProperty(property)) {
			exports.property = property;
		}
	}
}

function reportError (command, preface, error) {
	internals.browser.createPost(
		command.post.topic_id,
		command.post.post_number,
		'' + preface + error,
		() => 0
	);
}

function respondWithTemplate(templateFile, data, command) {
	return readFile(__dirname + '/' + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		internals.browser.createPost(command.post.topic_id, command.post.post_number, output, () => 0);
	});
}


function registerPlayerCommands(events) {
	patchIn(playerController);
	events.onCommand('for', 'vote for a player to be executed', exports.voteHandler, () => 0);
	events.onCommand('join', 'join current mafia game', exports.joinHandler, () => 0);
	events.onCommand('list-all-players', 'list all players, dead and alive', exports.listAllPlayersHandler, () => 0);
	events.onCommand('list-all-votes', 'list all votes from the game\'s start', exports.listAllVotesHandler, () => 0);
	events.onCommand('list-players', 'list all players still alive', exports.listPlayersHandler, () => 0);
	events.onCommand('list-votes', 'list all votes from the day\'s start', exports.listVotesHandler, () => 0);
	events.onCommand('no-lynch', 'vote for noone to be lynched', exports.nolynchHandler, () => 0);
	events.onCommand('nolynch', 'vote for noone to be lynched', exports.nolynchHandler, () => 0);
	events.onCommand('unvote', 'rescind your vote', exports.unvoteHandler, () => 0);
	events.onCommand('vote', 'vote for a player to be executed (alt. form)', exports.voteHandler, () => 0);
}

function registerModCommands(events) {
	patchIn(modController);
	events.onCommand('prepare', 'Start a new game', exports.prepHandler, () => 0);
	events.onCommand('start', 'move a game into active play (mod only)', exports.startHandler, () => 0);
	events.onCommand('new-day', 'move on to a new day (mod only)', exports.dayHandler, () => 0);
	events.onCommand('kill', 'kill a player (mod only)', exports.killHandler, () => 0);
	events.onCommand('end', 'end the game (mod only)', exports.finishHandler, () => 0);
}

function registerCommands(events) {
	events.onCommand('echo', 'echo a bunch of post info (for diagnostic purposes)', exports.echoHandler, () => 0);
	registerPlayerCommands(events);
	registerModCommands(events);
}

/**
 * Register the players listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} players Array of player names to add to the game.
 */
/*eslint-disable no-console*/
function registerPlayers(game, players) {
	return dao.ensureGameExists(game)
		.then(() => Promise.mapSeries(
			players,
			function(player) {
				console.log('Mafia: Adding player: ' + player);
				return dao.addPlayerToGame(game, player)
					.catch((err) => {
						console.log('Mafia: Adding player: failed to add player: ' + player
							+ '\n\tReason: ' + err);
						return Promise.resolve();
					});
			}
		));
}
/*eslint-enable no-console*/

// Open commands

/**
  * Echo: Echo diagnostic information
  * @example !echo
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.echoHandler = function (command) {
	const text = 'topic: ' + command.post.topic_id + '\n'
		+ 'post: ' + command.post.post_number + '\n'
		+ 'input: `' + command.input + '`\n'
		+ 'command: `' + command.command + '`\n'
		+ 'args: `' + command.args + '`\n'
		+ 'mention: `' + command.mention + '`\n'
		+ 'post:\n[quote]\n' + command.post.cleaned + '\n[/quote]';
	view.respond(command, text);
	return Promise.resolve();
};


/**
 * Start the plugin after login
 */
exports.start = function start() {};

/**
 * Stop the plugin prior to exit or reload
 */
exports.stop = function stop() {};

/**
 * Prepare Plugin prior to login
 *
 * @param {*} plugConfig Plugin specific configuration
 * @param {Config} config Overall Bot Configuration
 * @param {externals.events.SockEvents} events EventEmitter used for the bot
 * @param {Browser} browser Web browser for communicating with discourse
 */
/*eslint-disable no-console*/
exports.prepare = function prepare(plugConfig, config, events, browser) {
	if (Array.isArray(plugConfig)) {
		plugConfig = {
			messages: plugConfig
		};
	}
	if (plugConfig === null || typeof plugConfig !== 'object') {
		plugConfig = {};
	}
	if (plugConfig.players) {
		plugConfig.players.concat(unvoteNicks);
	}
	internals.events = events;
	internals.browser = browser;
	internals.configuration = config.mergeObjects(true, exports.defaultConfig, plugConfig);
	return dao.createDB(internals.configuration)
		.then(() => dao.ensureGameExists(plugConfig.thread))
		.catch((reason) => {
			if (reason === 'Game does not exist') {
				return dao.addGame(plugConfig.thread, plugConfig.name);
			} else {
				console.log('Mafia: Error: Game not added to database.\n'
					+ '\tReason: ' + reason);
				return Promise.reject('Game not created');
			}
		})
		.then(() => {
			if (plugConfig.players) {
				return registerPlayers(plugConfig.thread, plugConfig.players);
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			if (plugConfig.mods) {
				return Promise.each(
					plugConfig.mods,
					(mod) => dao.addMod(plugConfig.thread, mod)
				);
			} else {
				return Promise.resolve();
			}			
		})
		.then(() => {
			view.setBrowser(browser);
			modController.init(config, browser);
			playerController.init(config, browser);
			registerCommands(events);
		})
		.catch((err) => {
			console.log('ERROR! ' + err);
		});
};
/*eslint-enable no-console*/
