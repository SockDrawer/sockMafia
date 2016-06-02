'use strict';

/**
 * sockMafia Mod controller
 * @module sockmafia.MafiaModController
 * @author Yamikuronue
 * @license MIT
 */

const view = require('./view');
const Promise = require('bluebird');
const debug = require('debug')('sockbot:mafia:modController');


exports.internals = {};
let eventLogger;

exports.init = function(forum) {
	eventLogger = forum;
};

/**
 * Valid properties for a player to hold
 * @type {Array}
 */
const validProperties = [
	'loved',
	'hated',
	'doublevoter'
];

/**
 * Log an error that was recovered from
 * @param  {Error} error The error to log
 */
function logRecoveredError(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logExtended', 3, error);
	}
}

/**
 * Log a debug statement
 * @param  {String} statement The statement to log
 */
function logDebug(statement) {
	debug(statement);
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logExtended', 5, statement);
	}
}

/**
 * The controller class for Mafiabot
 */
class MafiaModController {

	/**
	 * The constructor
	 * @param  {sockmafia.src.dao.MafiaDao} d      The dao to use to persist the data
	 * @param  {Object} config The parsed configuration file pertaining to this instance of the plugin
	 */
	constructor(d, config) {
		this.dao = d;
	}
	
	/**
	 * Activate the controller
	 * @param  {Forum} forum The forum to activate for
	 */
	activate(forum) {
		//Register commandss
        forum.Commands.add('set', 'Assign a player a role (mod only)', this.setHandler.bind(this));
        forum.Commands.add('kill', 'kill a player (mod only)', this.killHandler.bind(this));
        forum.Commands.add('new-day', 'move on to a new day (mod only)', this.dayHandler.bind(this));
        forum.Commands.add('next-phase', 'move on to the next phase (mod only)', this.daHandler.bind(this));
    }

    /**
     * Set: et a prperty fr. 
     * No game rules; this sets up rules f * 
     * @param {Sockbot.commands.command} command The command object
     */
	setHandler (command) {
		// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
		// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
		const targetString = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		const property = command.args[1];
		let gameId, modName, game, mod, target;

		const isNumeric = (input) => {
			return /^\d+$/.test(input);
		};
		
		const processArgs = () => {
			if (command.args[2] === 'in' && command.args[3]) {
				if (!isNumeric(command.args[3])) {
					return this.dao.getGameByName(command.args.slice(3).join(' '));
				} else {
					gameId = command.args[3];
				}
			}
			
			return this.dao.getGameByTopicId(gameId);
		};

		return command.getTopic().then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				modName = user.username;
				logDebug('Received set property request from ' + modName + ' for ' + targetString + ' in thread ' + gameId);
				return processArgs();
			})
			.then((g) => {
				game = g;
				return game.isActive ? Promise.resolve() : Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => {
				try {
					mod = game.getModerator(modName);
				} catch (_) {
					throw new Error('You are not a moderator!');
				}
				return mod.isModerator ? Promise.resolve() : Promise.reject('You are not a moderator');
			})
			.then(() => {
				if (!validProperties.contains(property.toLowerCase())) {
					return Promise.reject('Property not valid.\n Valid properties: ' + validProperties.join(', '));
				}
				
				try {
					target = game.getPlayer(targetString);
				} catch (_) {
					throw new Error('Target not in game');
				}
				return target.isAlive ? Promise.resolve() : Promise.reject('Target not alive');
			})
			.then(() => target.addProperty(property))
			.then(() => {
				logDebug('Player ' + target.username + ' is now ' + property + ' in ' + game);
				return view.respondWithTemplate('templates/modSuccess.handlebars', {
					command: 'Set property',
					results: 'Player ' + target.username + ' is now ' + property,
					game: game
				}, command);
			})
			.catch((err) => {
				logRecoveredError('Error when setting property: ' + err);
				view.reportError(command, 'Error setting player property: ', err);
			});
	}

	/**
	* New-day: A mod function that starts a new day
	* Must be used in the game thread.
	*
	* Game rules:
	*  - A game can advance to day when it is in the night phase
	*  - A game can advance to night when it is in the day phase
	*  - A game can only be advanced by the mod
	*  - When the game is advanced to day, a new day starts
	*  - When the game is advanced to night, a new day does not start
	*  - When a new day starts, the vote counts from the previous day are reset
	*  - When a new day starts, the list of players is output for convenience
	*  - When a new day starts, the "to-lynch" count is output for convenience
	*
	* @example !new-day
	*
	* @param  {commands.command} command The command that was passed in.
	* @returns {Promise}        A promise that will resolve when the game is ready
	*/
	dayHandler (command) {
		const data = {
			numPlayers: 0,
			toExecute: 0,
			day: 0,
			names: []
		};
		let gameId, modName, currDay, currPhase, game, mod;

			return command.getTopic().then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				modName = user.username;
				logDebug('Received new day request from ' + modName + ' in thread ' + game);
				return this.dao.getGameByTopicId(gameId);
			})
			.then((g) => {
				game = g;
				currDay = game.day;
				currPhase = game.phase;
				return game.isActive ? Promise.resolve() : Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => {
				try {
					mod = game.getModerator(modName);
				} catch (_) {
					return Promise.reject('You are not a moderator');
				}
				return mod.isModerator ? Promise.resolve() : Promise.reject('You are not a moderator');
			})
			.then(() => {
				return game.nextPhase();
			})
			.then(() => {
				debug('Went from ' + currDay + ' ' + currPhase + ' to ' + game.day + ' ' + game.phase);
				
				if (command.args[0] === 'ends' && command.args[1]) {
					command.args.shift();
					data.phaseEnd = command.args.join(' ');
					data.showPhaseEnd = true;
					
					return game.setValue('phaseEnd', data.phaseEnd);
				} else {
					data.showPhaseEnd = false;
					return Promise.resolve();
				}
			})
			.then(() => {
				if (game.day > currDay) {
					
					const numPlayers = game.livePlayers.length;
					data.day = game.day;
					data.toExecute = Math.ceil(numPlayers / 2);
					
					data.numPlayers = game.livePlayers.length;
					
					data.names = game.livePlayers.map((player) => {
						return player.username;
					});

					logDebug('Moved to new day in  ' + game.name);
					return view.respondWithTemplate('/templates/newDayTemplate.handlebars', data, command);
				} else {
					let text = 'It is now ' + game.phase;
					if (data.showPhaseEnd) {
						text += '. The phase will end ' + data.phaseEnd;
					}
					return view.respond(command, text);
				}
				
			})
			.catch((err) => {
				logRecoveredError('Error incrementing day: ' + err);
				view.reportError(command, 'Error incrementing day: ', err);
			});
	}

	/**
	* Kill: A mod function that modkills or nightkills a player.
	* Must be used in the game thread.
	*
	* Game rules:
	*  - A player can only be killed if they are already in the game.
	*  - A player can only be killed if they are alive.
	*  - A player can only be !killed by the mod.
	*
	* @example !kill playerName
	*
	* @param  {commands.command} command The command that was passed in.
	* @returns {Promise}        A promise that will resolve when the game is ready
	*/
	killHandler (command) {
		// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
		// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
		const targetString = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		let gameId, modName, game, mod, target;

			return command.getTopic().then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				modName = user.username;
				logDebug('Received kill request from ' + modName + 'for ' + target + ' in thread ' + gameId);
				return this.dao.getGameByTopicId(gameId);
			})
			.then((g) => {
				game = g;
				return game.isActive ? Promise.resolve() : Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => {
				try {
					mod = game.getModerator(modName);
				} catch (_) {
					return Promise.reject('You are not a moderator');
				}
				return mod.isModerator ? Promise.resolve() : Promise.reject('You are not a moderator');
			})
			.then(() => {
				try {
					target = game.getPlayer(targetString);
				} catch (_) {
					throw new Error('Target not in game');
				}
				return target.isAlive ? Promise.resolve() : Promise.reject('Target not alive');
			})
			.then(() => game.killPlayer(targetString))
			.then(() => {
				logDebug('Killing ' + target);
				return view.respondWithTemplate('templates/modSuccess.handlebars', {
					command: 'Kill',
					results: 'Killed @' + targetString,
					game: game.name
				}, command);
			})
			.catch((err) => {
				logRecoveredError('Error killing player: ' + err);
				view.reportError(command, 'Error killing player: ', err);
			});
	}
}

module.exports = MafiaModController;
