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

const MafiaDao = require('./dao');
const MafiaModController = require('./mod_controller');
const MafiaPlayerController = require('./player_controller');
const view = require('./view');
const Promise = require('bluebird');
const debug = require('debug')('sockbot:mafia');

let dao, modController,  playerController;


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
	db: './mafiadb',

	voteBars: 'bastard'
};

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
Array.prototype.contains = function (element) {
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/

// Helper functions

function patchIn(module) {
	for (const property in module) {
		if (typeof module[property] === 'function' && module.hasOwnProperty(property)) {
			exports[property] = module[property].bind(module); // Bind to preserve `this` context
		}
	}
}

/*eslint-disable no-console*/
function handleCallback(err) {
	if (err) {
		console.log('ERROR: ' + err.toString() + '\n' + err.stack);
	}
}
/*eslint-enable no-console*/

function registerPlayerCommands(events) {
}

function registerModCommands(events) {

}

function registerCommands(forum) {
	forum.Commands.add('echo', 'echo a bunch of post info (for diagnostic purposes)', exports.echoHandler, handleCallback);
}

/**
 * Register the mods listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} mods Array of mod names to add to the game.
 */
/*eslint-disable no-console*/
function registerMods(game, mods) {
	return Promise.mapSeries(
			mods,
			function (mod) {
				console.log('Mafia: Adding mod: ' + mod);
				return game.addModerator(mod)
					.catch((err) => {
						console.log('Mafia: Adding mod: failed to add mod: ' + mod + '\n\tReason: ' + err);
						return Promise.resolve();
					});
			}
		);
}
/*eslint-enable no-console*/

/**
 * Register the players listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} players Array of player names to add to the game.
 */
/*eslint-disable no-console*/
function registerPlayers(game, players) {
	return Promise.mapSeries(
			players,
			function (player) {
				console.log('Mafia: Adding player: ' + player);
				return game.addPlayer(player)
					.catch((err) => {
						console.log('Mafia: Adding player: failed to add player: ' + player + '\n\tReason: ' + err);
						return Promise.resolve();
					});
			}
		);
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
	const text = 'topic: ' + command.post.topic_id + '\n' + 'post: ' +
		command.post.post_number + '\n' + 'input: `' + command.input + '`\n' +
		'command: `' + command.command + '`\n' + 'args: `' + command.args + '`\n' +
		'mention: `' + command.mention + '`\n' + 'post:\n[quote]\n' + command.post.cleaned +
		'\n[/quote]';
	view.respond(command, text);
	return Promise.resolve();
};

exports.createFromDB = function (plugConfig) {
	let game;

	return dao.createGame(plugConfig.thread, plugConfig.name)
		.catch((err) => {
			/*eslint-disable no-console*/
			if (err === 'E_GAME_EXISTS') {
				console.log('Existing game found, augmenting');
				return dao.getGameByTopicId(plugConfig.thread);
			} else {
				console.log('ERROR! ' + err, err.stack);
				/*eslint-enable no-console*/
				throw err; // rethrow error to fail bot startup
			}
		
		})
		.then((g) => {
			game = g;
			if (plugConfig.players) {
				return registerPlayers(game, plugConfig.players);
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			if (plugConfig.mods) {
				return registerMods(game, plugConfig.mods);
			} else {
				return Promise.resolve();
			}
		})
		.catch((err) => {
			/*eslint-disable no-console*/
			console.log('ERROR! ' + err, err.stack);
			/*eslint-enable no-console*/
			throw err; // rethrow error to fail bot startup
		});
};


/*eslint-disable no-console*/
// Sockbot 3.0 activation function
exports.activate = function activate() {
	debug('activating mafiabot');
	const plugConfig = internals.configuration;

	dao = new MafiaDao(plugConfig.db);
	modController = new MafiaModController(dao, plugConfig);
	playerController = new MafiaPlayerController(dao, plugConfig);
	view.init(internals.forum.Post, internals.forum.Formatter);
	
	playerController.activate(internals.forum);
	modController.activate(internals.forum);

	return exports.createFromDB(plugConfig).then(() => {
		return registerCommands(internals.forum);
	});
};

// Sockbot 3.0 Plugin function
exports.plugin = function plugin(forum, config) {
	debug('creating plugin object');
	if (Array.isArray(config)) {
		config = {
			messages: config
		};
	}
	if (config === null || typeof config !== 'object') {
		config = {};
	}
	Object.keys(exports.defaultConfig).forEach((key) => {
		if (!config[key]) {
			config[key] = exports.defaultConfig[key];
		}
	});
	internals.configuration = config;
	internals.forum = forum;

	return {
		activate: exports.activate,
		deactivate: () => Promise.resolve()
	};
};
/*eslint-enable no-console*/
