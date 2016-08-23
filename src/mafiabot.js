'use strict';
/**
 * Mafiabot plugin
 *
 * Helps run mafia games, providing features such as vote tracking and listing.
 *
 * @module sockmafia
 * @author Accalia, Dreikin, Yamikuronue
 * @license MIT
 */

/**
 * @external Forum
 * @see {@link https://github.com/SockDrawer/SockBot/blob/master/docs/api/providers/nodebb/index.md#sockbot.providers.module_nodebb..Forum}
 */


// Requisites

const MafiaDao = require('./dao');
const MafiaModController = require('./mod_controller');
const MafiaPlayerController = require('./player_controller');
const view = require('./view');
const Promise = require('bluebird');
const debug = require('debug')('sockbot:mafia');
require('./utils');

let dao, modController, playerController;


// Defaults

/**
 * Default plugin configuration
 */
exports.defaultConfig = {
	/**
	 * File location for database.
	 *
	 * @default
	 * @type {string}
	 */
	db: './mafiadb',

	options: {
		chat: 'disabled',
		voteBars: 'bastard',
		postman: 'off'
	}
};

const internals = {
	browser: null,
	configuration: exports.defaultConfig,
	timeouts: {},
	interval: null,
	events: null,
	dao: dao
};
exports.internals = internals;

/*eslint-disable no-console*/
/**
 * Sockbot 3.0 Activation function
 * @returns {Promise} A promise that will resolve when the activation is complete
 */
exports.activate = function activate() {
	debug('activating mafiabot');
	const plugConfig = internals.configuration;

	dao = new MafiaDao(plugConfig.db);
	modController = new MafiaModController(dao, plugConfig);
	playerController = new MafiaPlayerController(dao, plugConfig);

	view.activate(internals.forum);
	playerController.activate(internals.forum);
	modController.activate(internals.forum);

	let gameConfig = plugConfig.games;
	if (!Array.isArray(gameConfig)) {
		gameConfig = [plugConfig];
	}

	return Promise.all(gameConfig.map((config) => exports.createFromFile(config)));
};

/**
 * Sockbot 3.0 Plugin function
 * @param  {Forum} forum  The forum provider's Forum class
 * @param  {Object} config The plugin-specific configuration
 * @returns {Object}        A temporary object representing this instance of the forum
 */
exports.plugin = function plugin(forum, config) {
	debug('creating plugin object');
	if (config === null || typeof config !== 'object') {
		config = {};
	}
	if (Array.isArray(config)) {
		config = {
			messages: config
		};
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

/**
 * Register the mods listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} mods Array of mod names to add to the game.
 */
function registerMods(game, mods) {
	return Promise.mapSeries(
		mods,
		function (mod) {
			console.log('Mafia: Adding mod: ' + mod);
			return game.addModerator(mod)
				.catch((err) => {
					if (err !== 'E_USER_EXIST') {
						console.log('Mafia: Adding mod: failed to add mod: ' + mod + '\n\tReason: ' + err);
					}
					return Promise.resolve();
				});
		}
	);
}

/**
 * Register the players listed in the configuration.
 *
 * @param {Number} game Thread number for the game.
 * @param {string[]} players Array of player names to add to the game.
 */
function registerPlayers(game, players) {
	return Promise.mapSeries(
		players,
		function (player) {
			console.log('Mafia: Adding player: ' + player);
			return game.addPlayer(player)
				.catch((err) => {
					if (err !== 'E_USER_EXIST') {
						console.log('Mafia: Adding player: failed to add player: ' + player + '\n\tReason: ' + err);
					}
					return Promise.resolve();
				});
		}
	);
}

/*eslint-enable no-console*/

// Open commands

/**
 * Create the game from the configuration file
 * @param  {Object} plugConfig The configuration file
 * @returns {Promise}           A promise that resolves when the creation is complete
 */
exports.createFromFile = function (plugConfig) {
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
		.then(() => {
			const prom = Object.keys(plugConfig.options).map((key) => {
				if (game.getValue(key) === undefined) {
					return game.setValue(key, plugConfig.options[key]);
				}
				return Promise.resolve();
			});
			return Promise.all(prom);
		})
		.then(() => {
			if (plugConfig.voteBars) {
				console.log('WARNING: Setting voteBars via old style config detected!'); //eslint-disable-line no-console
				if (game.getValue('voteBars') === undefined) {
					return game.setValue('voteBars', plugConfig.voteBars);
				}
				return Promise.resolve();
			}
			return Promise.resolve();
		})
		.catch((err) => {
			/*eslint-disable no-console*/
			console.log('ERROR! ' + err, err.stack);
			/*eslint-enable no-console*/
			throw err; // rethrow error to fail bot startup
		});
};
