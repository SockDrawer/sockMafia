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
// Constants

const unvoteNicks = ['unvote', 'no-lynch', 'nolynch'];

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
			exports[property] = module[property];
		}
	}
}

/*eslint-disable no-console*/
function handleCallback(err) {
	if (err) {
		console.log('ERROR: ' + err.toString());
	}
}
/*eslint-enable no-console*/

function registerPlayerCommands(events) {
	patchIn(playerController);
	events.onCommand('for', 'vote for a player to be executed', exports.voteHandler, handleCallback);
	events.onCommand('join', 'join current mafia game', exports.joinHandler, handleCallback);
	events.onCommand('list-all-players', 'list all players, dead and alive', exports.listAllPlayersHandler, handleCallback);
	events.onCommand('list-all-votes', 'list all votes from the game\'s start', exports.listAllVotesHandler, handleCallback);
	events.onCommand('list-players', 'list all players still alive', exports.listPlayersHandler, handleCallback);
	events.onCommand('list-votes', 'list all votes from the day\'s start', exports.listVotesHandler, handleCallback);
	events.onCommand('no-lynch', 'vote for noone to be lynched', exports.nolynchHandler, handleCallback);
	events.onCommand('nolynch', 'vote for noone to be lynched', exports.nolynchHandler, handleCallback);
	events.onCommand('unvote', 'rescind your vote', exports.unvoteHandler, handleCallback);
	events.onCommand('vote', 'vote for a player to be executed (alt. form)', exports.voteHandler, handleCallback);
}

function registerModCommands(events) {
	patchIn(modController);
	events.onCommand('prepare', 'Start a new game', exports.prepHandler, handleCallback);
	events.onCommand('start', 'move a game into active play (mod only)', exports.startHandler, handleCallback);
	events.onCommand('new-day', 'move on to a new day (mod only)', exports.dayHandler, handleCallback);
	events.onCommand('next-phase', 'move on to the next phase (mod only)', exports.dayHandler, handleCallback);
	events.onCommand('kill', 'kill a player (mod only)', exports.killHandler, handleCallback);
	events.onCommand('set', 'Assign a player a role (mod only)', exports.setHandler, handleCallback);
	events.onCommand('end', 'end the game (mod only)', exports.finishHandler, handleCallback);
}

function registerCommands(events) {
	events.onCommand('echo', 'echo a bunch of post info (for diagnostic purposes)', exports.echoHandler, handleCallback);
	registerPlayerCommands(events);
	registerModCommands(events);
}

/**
 * Register the mods listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} mods Array of mod names to add to the game.
 */
/*eslint-disable no-console*/
function registerMods(game, mods) {
	return dao.ensureGameExists(game)
		.then(() => Promise.mapSeries(
			mods,
			function (mod) {
				console.log('Mafia: Adding mod: ' + mod);
				return dao.addMod(game, mod)
					.catch((err) => {
						console.log('Mafia: Adding mod: failed to add mod: ' + mod + '\n\tReason: ' + err);
						return Promise.resolve();
					});
			}
		));
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
	return dao.ensureGameExists(game)
		.then(() => Promise.mapSeries(
			players,
			function (player) {
				console.log('Mafia: Adding player: ' + player);
				return dao.addPlayerToGame(game, player)
					.catch((err) => {
						console.log('Mafia: Adding player: failed to add player: ' + player + '\n\tReason: ' + err);
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
	const text = 'topic: ' + command.post.topic_id + '\n' + 'post: ' + command.post.post_number + '\n' + 'input: `' + command.input + '`\n' + 'command: `' + command.command + '`\n' + 'args: `' + command.args + '`\n' + 'mention: `' + command.mention + '`\n' + 'post:\n[quote]\n' + command.post.cleaned + '\n[/quote]';
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
	internals.owner = config.core.owner;
	internals.username = config.core.username;
	internals.configuration = config.mergeObjects(true, exports.defaultConfig, plugConfig);
	return dao.createDB(internals.configuration)
		.then(() => dao.ensureGameExists(plugConfig.thread))
		.catch((reason) => {
			if (reason === 'Game does not exist') {
				return dao.addGame(plugConfig.thread, plugConfig.name);
			} else {
				console.log('Mafia: Error: Game not added to database.\n' + '\tReason: ' + reason);
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
				return registerMods(plugConfig.thread, plugConfig.mods);
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			view.setBrowser(browser);
			modController.init(config, browser, events);
			playerController.init(config, browser, events);
			registerCommands(events);
		})
		.catch((err) => {
			console.log('ERROR! ' + err);
		});
};

// Sockbot 3.0 activation function
exports.activate = function activate() {
	const plugConfig = internals.configuration;
	const fakeBrowser = {
		createPost: (topic_id, post_id, content) => {
			return internals.forum.Post.reply(topic_id, post_id, content);
		}
	};
	const fakeConfig = {
		username: internals.forum.username,
		owner: internals.owner.username
	};
	const fakeEvents = {
		emit: function () {
			const args = Array.prototype.slice.apply(arguments);
			switch (args[0]) { // shim event name changes
			case 'logError':
				args[0] = 'error';
				break;
			case 'logWarning':
				args[0] = 'log';
				break;
			}
			internals.forum.emit.apply(internals.forum, args);
		},
		onCommand: (command, help, handler) => {
			function translateHandler(command) {
				return Promise.all([
					command.getPost(),
					command.getTopic(),
					command.getUser()
				]).then((data) => {
					const translated = {
						input: command.line,
						command: command.command,
						args: command.args,
						mention: command.mention,
						post: {
							username: data[2].username,
							topic_id: data[1].id,
							post_number: data[0].id,
							cleaned: data[0].content
						}
					};
					return handler(translated);
				});
			}
			return internals.forum.Commands.add(command, help, translateHandler);
		}
	};
	return dao.createDB(internals.configuration)
		.then(() => dao.ensureGameExists(plugConfig.thread))
		.catch((reason) => {
			if (reason === 'Game does not exist') {
				return dao.addGame(plugConfig.thread, plugConfig.name);
			} else {
				console.log('Mafia: Error: Game not added to database.\n' + '\tReason: ' + reason);
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
				return registerMods(plugConfig.thread, plugConfig.mods);
			} else {
				return Promise.resolve();
			}
		})
		.then(() => {
			view.setBrowser(fakeBrowser);
			modController.init(fakeConfig, fakeBrowser, fakeEvents);
			playerController.init(fakeConfig, fakeBrowser, fakeEvents);
			registerCommands(fakeEvents);
		})
		.catch((err) => {
			console.log('ERROR! ' + err);
			throw err; // rethrow error to fail bot startup
		});
};

// Sockbot 3.0 Plugin function
exports.plugin = function plugin(forum, config) {
	if (Array.isArray(config)) {
		config = {
			messages: config
		};
	}
	if (config === null || typeof config !== 'object') {
		config = {};
	}
	if (config.players) {
		config.players.concat(unvoteNicks);
	}
	internals.configuration = config.mergeObjects(true, exports.defaultConfig, config);
	internals.forum = forum;
	return {
		activate: exports.activate,
		deactivate: () => Promise.resolve()
	};
};
/*eslint-enable no-console*/
