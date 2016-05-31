'use strict';

const dao = require('./dao/index.js');
const validator = require('./validator');
const view = require('./view');
const Promise = require('bluebird');

exports.internals = {};
let eventLogger;

exports.init = function(forum) {
	eventLogger = forum;
};


const validProperties = [
	'loved',
	'hated',
	'doublevoter'
];

/*eslint-disable no-extend-native*/
Array.prototype.contains = function(element){
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/

function logUnhandledError(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('error', 'Unrecoverable error! ' + error.toString());
		eventLogger.emit('error', error.stack);
	}
}

function logRecoveredError(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logExtended', 3, error);
	}
}


function logDebug(statement) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logExtended', 5, statement);
	}
}


class MafiaModController {
	constructor(d, config) {
		this.dao = d;
	}
	
	activate(forum) {
		//Register commandss
        forum.Commands.add('set', 'Assign a player a role (mod only)', this.setHandler.bind(this));
        forum.Commands.add('kill', 'kill a player (mod only)', this.killHandler.bind(this));
        forum.Commands.add('new-day', 'move on to a new day (mod only)', this.dayHandler.bind(this));
    }

	/**
	* Prepare: A mod function that starts a new game in the Prep phase.
	* Must be used in the game thread. The user becomes the mod.
	* Game rules:
	*  - A new game can only be started in a thread that does not already have a game
	*
	* @example !prepare gameName
	*
	* @param  {commands.command} command The command that was passed in.
	* @returns {Promise}        A promise that will resolve when the game is ready
	*/
	prepHandler (command) {
		const id = command.post.topic_id;
		const player = command.post.username;
		const gameName = command.args[0];

		logDebug('Received new game request from ' + player + ' in thread ' + id);

		return dao.getGameStatus(id)
			.then(
				(status) => {
					if (status === dao.gameStatus.auto) {
						return dao.convertAutoToPrep(id, gameName);
					}
					return Promise.reject('Game is in the wrong status. The game is ' + status);
				},
				() => dao.addGame(id, gameName))
			.then(() => dao.addMod(id, player))
			.then(() => {
				logDebug('Game ready to play in thread ' + id);
				view.respond(command, 'Game "' + gameName + '" created! The mod is @' + player);
			})
			.catch((err) => view.reportError(command, 'Error when starting game: ', err));
	}

	/**
	 * Start: A mod function that starts day 1 of a game
	 * Must be used in the game thread.
	 *
	 * Game rules:
	 *  - A game can only be started if it is in the prep phase
	 *  - A game can only be started by the mod
	 *  - When the game starts, it starts on Daytime of Day 1
	 *
	 * @example !start
	 *
	 * @param  {commands.command} command The command that was passed in.
	 * @returns {Promise}        A promise that will resolve when the game is ready
	 */
	startHandler (command) {
		const game = command.post.topic_id;
		const mod = command.post.username;

		logDebug('Received begin game request for game ' + game);
		
		return dao.getGameStatus(game)
			.then((status) => {
				if (status === dao.gameStatus.prep) {
					return Promise.resolve();
				}
				if (status === dao.gameStatus.auto) {
					return Promise.reject('Game not in prep phase. Try `!prepare`.');
				}
				return Promise.reject('Incorrect status: ' + status);
			})
			.then(() => validator.mustBeTrue(dao.isPlayerMod, [game, mod], 'Poster is not mod'))
			.then(() => dao.setGameStatus(game, dao.gameStatus.running))
			.then(() => dao.incrementDay(game))
			.then(() => dao.setCurrentTime(game, dao.gameTime.day))
			.then(() => {
				logDebug('Started game ' + game);
				return view.respondWithTemplate('templates/modSuccess.handlebars', {
					command: 'Start game',
					results: 'Game is now ready to play',
					game: game
				}, command);
			})
			.catch((err) => {
				logRecoveredError('Error when starting game: ' + err);
				view.reportError(command, 'Error when starting game: ', err);
			});
	};

	setHandler (command) {
		// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
		// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
		const targetString = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		const property = command.args[1];
		let gameId, modName, game, mod, target;

		

		return command.getTopic().then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				modName = user.username;
				logDebug('Received set property request from ' + modName + 'for ' + target + ' in thread ' + gameId);
				return this.dao.getGameByTopicId(gameId);
			})
			.then((g) => {
				game = g;
				return game.isActive ? Promise.resolve() : Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => {
				mod = game.getPlayer(modName);
				if (!mod) {
					throw new Error('You are not in the game!');
				}
				return mod.isModerator ? Promise.resolve() : Promise.reject('You are not a moderator');
			})
			.then(() => {
				if (!validProperties.contains(property.toLowerCase())) {
					return Promise.reject('Property not valid.\n Valid properties: ' + validProperties.join(', '));
				}
			})
			.then(() => {
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
		let gameId, modName, currDay, game, mod;

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
				return game.isActive ? Promise.resolve() : Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => {
				mod = game.getPlayer(modName);
				return mod.isModerator ? Promise.resolve() : Promise.reject('You are not a moderator');
			})
			.then(() => {
				return game.nextPhase();
			})
			.then(() => {
				if (game.day > currDay) {
					const numPlayers = game.livePlayers.length;
					data.toExecute = Math.ceil(numPlayers / 2);
					data.numPlayers = game.livePlayers.length;
					data.names = game.live.map((player) => {
						return player.properName;
					});

					logDebug('Moved to new day in  ' + game);
					view.respondWithTemplate('/templates/newDayTemplate.handlebars', data, command);
				}
				view.respond(command, 'Incremented stage for ' + game.name);
				return Promise.Resolve();	
			})
			.catch((err) => {
				logRecoveredError('Error incrementing day: ' + err);
				view.reportError(command, 'Error incrementing day: ', err);
			});
	};

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
				mod = game.getPlayer(modName);
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
	};

	/**
	* End: A mod function that ends the game
	* Must be used in the game thread.
	*
	* Game rules:
	*  - A game can only be ended if it is running
	*  - A game can only be ended by the mod
	*  - When the game ends, surviving players are listed for convenience
	*
	* @example !end
	*
	* @param  {commands.command} command The command that was passed in.
	* @returns {Promise}        A promise that will resolve when the game is ready
	*/
	finishHandler (command) {
		const game = command.post.topic_id;
		const mod = command.post.username;

		logDebug('Received end game request from ' + mod + ' in thread ' + game);
		return dao.getGameStatus(game)
			.then((status) => {
				if (status === dao.gameStatus.running) {
					return Promise.resolve();
				}
				return Promise.reject('Game not started. Try `!start`.');
			})
			.then(() => validator.mustBeTrue(dao.isPlayerMod, [game, mod], 'Poster is not mod'))
			.then(() => dao.incrementDay(game))
			.then(() => dao.setGameStatus(game, dao.gameStatus.finished))
			.then(() => require('./player_controller').listAllPlayersHandler(command))
			.then(() => {
				logDebug('Ending game ' + game);
				return view.respondWithTemplate('templates/modSuccess.handlebars', {
					command: 'End game',
					results: 'Game now finished.',
					game: game
				}, command);
			})
			.catch((err) => {
				logRecoveredError('Error finalizing game: ' + err);
				view.reportError(command, 'Error finalizing game: ', err);
			});
	};
};

module.exports = MafiaModController;
