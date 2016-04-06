'use strict';

const dao = require('./dao');
const validator = require('./validator');
const view = require('./view');
const Promise = require('bluebird');

exports.internals = {};
let eventLogger;

exports.init = function(config, browser, events) {
	view.init(browser);
	exports.internals.configuration = config;
	eventLogger = events;
};

/*eslint-disable no-extend-native*/
Array.prototype.contains = function(element){
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/

function logUnhandledError(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logError', 'Unrecoverable error! ' + error.toString());
		eventLogger.emit('logError', error.stack);
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
exports.prepHandler = function (command) {
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
};

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
exports.startHandler = function (command) {
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

exports.setHandler = function (command) {
	const game = command.post.topic_id;
	const mod = command.post.username;
	const target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
	const property = command.args[1];
	
	const validProperties = [
		'loved',
		'hated',
		'doublevoter'
	];
	
	logDebug('Received set property request for ' + target + ' in thread ' + game);
	return dao.getGameStatus(game)
		.then((status) => {
			if (status === dao.gameStatus.finished) {
				return Promise.reject('The game is over!');
			}
			return Promise.resolve();
		})
		.then(() => validator.mustBeTrue(dao.isPlayerMod, [game, mod], 'Poster is not mod'))
		.then(() => validator.mustBeTrue(dao.isPlayerInGame, [game, target], 'Target not valid'))
		.then(() => {
			if (!validProperties.contains(property.toLowerCase())) {
				return Promise.reject('Property not valid.\n Valid properties: ' + validProperties.join(', '));
			}
		})
		.then(() => dao.addPropertyToPlayer(game, target, property.toLowerCase()))
		.then(() => {
			logDebug('Player ' + target + ' is now ' + property + ' in ' + game);
			return view.respondWithTemplate('templates/modSuccess.handlebars', {
				command: 'Set property',
				results: 'Player ' + target + ' is now ' + property,
				game: game
			}, command);
		})
		.catch((err) => {
			logRecoveredError('Error when setting property: ' + err);
			view.reportError(command, 'Error setting player property: ', err);
		});
};

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
exports.dayHandler = function (command) {
	const game = command.post.topic_id;
	const mod = command.post.username;
	const data = {
		numPlayers: 0,
		toExecute: 0,
		day: 0,
		names: []
	};

	logDebug('Received new day request from ' + mod + ' in thread ' + game);
	return dao.getGameStatus(game)
		.then((status) => {
			if (status === dao.gameStatus.running) {
				return Promise.resolve();
			}
			return Promise.reject('Game not started. Try `!start`.');
		})
		.then(() => {
			return validator.mustBeTrue(dao.isPlayerMod, [game, mod], 'Poster is not mod');
		})
		.then(() => dao.getGameById(game))
		.then((gameInstance) => {
			if (gameInstance.time === dao.gameTime.day) {
				return dao.setCurrentTime(game, dao.gameTime.night).then(() => {
					const text = 'Incremented stage for ' + gameInstance.name;
					view.respond(command, text);
				});
			}

			//Otherwise, do the whole hog
			return dao.incrementDay(game).then(() => {
				data.day = gameInstance.day;
				return dao.setCurrentTime(game, dao.gameTime.day).then(() => {
					const text = 'Incremented day for ' + gameInstance.name;
					view.respond(command, text);
				});
			}).then(() => {
				return Promise.join(
					dao.getNumToLynch(game),
					dao.getLivingPlayers(game),
					(toLynch, livingPlayers) => {
						data.toExecute = toLynch;
						data.numPlayers = livingPlayers.length;

						data.names = livingPlayers.map((row) => {
							return row.player.properName;
						});

						logDebug('Moving to new day in  ' + game);
						view.respondWithTemplate('/templates/newDayTemplate.handlebars', data, command);
					}
				);	
			});	
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
exports.killHandler = function (command) {
	const game = command.post.topic_id;
	const mod = command.post.username;
	// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
	// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
	const target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
	
	logDebug('Received kill request from ' + mod + 'for ' + target + ' in thread ' + game);
	return dao.getGameStatus(game)
		.then((status) => {
			if (status === dao.gameStatus.running) {
				return Promise.resolve();
			}
			return Promise.reject('Game not started. Try `!start`.');
		})
		.then(() => validator.mustBeTrue(dao.isPlayerMod, [game, mod], 'Poster is not mod'))
		.then(() => validator.mustBeTrue(dao.isPlayerInGame, [game, target], 'Target not in game'))
		.then(() => validator.mustBeTrue(dao.isPlayerAlive, [game, target], 'Target not alive'))
		.then(() => dao.killPlayer(game, target))
		.then(() => dao.getGameById(game))
		.then(() => {
			logDebug('Killing ' + target);
			return view.respondWithTemplate('templates/modSuccess.handlebars', {
				command: 'Kill',
				results: 'Killed @' + target,
				game: game
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
exports.finishHandler = function (command) {
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
		.then(() => exports.listAllPlayersHandler(command))
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
