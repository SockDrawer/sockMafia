'use strict';

const dao = require('./dao');
const validator = require('./validator');
const view = require('./view');
const Promise = require('bluebird');

let myName, myOwner, eventLogger;

exports.init = function(config, browser, events) {
	view.setBrowser(browser);
	myName = config.username;
	myOwner = config.owner;
	eventLogger = events;
};


/**
 * Shuffle function using Fisher-Yates algorithm, from SO
 *
 * @param {string[]} array Array of strings
 * @returns {string[]} Shuffled array of strings
 */
function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}


function logUnhandledError(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logError','Unrecoverable error! ' + error.toString());
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
 * Helper method to lynch a player
 * @param  {Number} game   The ID of the game
 * @param  {String} target The player's name
 * @returns {Promise}        A promise to complete the lynch
 */
function lynchPlayer(game, target) {
	logDebug('Lynching target ' + target);

	return dao.setCurrentTime(game, dao.gameTime.night)
		.then(() => dao.killPlayer(game, target))
		.then((rosterEntry) => {
			const text = '@' + rosterEntry.player.properName + ' has been lynched! Stay tuned for the flip.'
				+ ' <b>It is now Night.</b>';
			view.respondInThread(game, text);
		})
		.catch((error) => {
			const text = 'Error when lynching player: ' + error.toString();
			view.respondInThread(game, text);
		});
}

/*Voting helpers*/

function verifyPlayerCanVote(game, voter) {
	logDebug('Checking if ' + voter + ' can vote.');
	return validator.mustBeTrue(dao.isPlayerInGame, [game, voter], 'Voter not in game')
		.then(() => validator.mustBeTrue(dao.isPlayerAlive, [game, voter], 'Voter not alive'))
		.then(() => validator.mustBeTrue(validator.isDaytime, [game], 'It is not day'));
}

function revokeCurrentVote(game, voter, post, type) {
	logDebug('Attempting to revoke current vote by ' + voter + (type ? 'of type ' + type : ''));
	const promiseArray = [];

	return new Promise((resolve) => {
		if (type) {
			resolve(dao.getCurrentActionByPlayer(game, voter, type));
		} else {
			resolve(dao.getCurrentVoteByPlayer(game, voter));
		}
	})
	.then((votes) => {
		if (!votes) {
			return true;
		}
		for (let i = 0; i < votes.length; i++) {
			promiseArray.push(dao.revokeAction(game, votes[i].post, post));
		}
		
		return Promise.all(promiseArray);
	});
}

function revokeCurrentVoteFor(game, voter, target, post) {
	logDebug('Attempting to revoke current vote by ' + voter + ' for ' + target);
	return dao.getCurrentVoteByPlayer(game, voter).then((votes) => {
		for (let i = 0; i < votes.length; i++) {
			if (votes[i].target.name.toLowerCase() === target.toLowerCase()) {
				return dao.revokeAction(game, votes[i].post, post);
			}
		}
		throw new Error('No such vote was found to revoke');
	});
}

function getVotingErrorText(reason, voter, target) {
	let text = ':wtf:';

	if (reason === 'Voter not in game') {
		text = '@' + voter + ': You are not yet a player.\n'
			+ 'Please use `@' + myName + ' join` to join the game.';
	} else if (reason === 'Voter not alive') {
		text = 'Aaagh! Ghosts!\n'
			+ '(@' + voter + ': You are no longer among the living.)';
	} else if (reason === 'Target not in game') {
		text = 'Who? I\'m sorry, @' + voter + ' but your princess is in another castle.\n'
			+ '(' + target + ' is not in this game.)';
	} else if (reason === 'Target not alive') {
		text = '@' + voter + ': You would be wise to not speak ill of the dead.';
	} else if (reason === 'Vote failed') {
		text = ':wtf:\nSorry, @' + voter + ': your vote failed.  No, I don\'t know why.'
			+ ' You\'ll have to ask @' + myOwner + ' about that.';
	} else {
		text += '\n' + reason;
	}
	return Promise.resolve(text);
}

/**
  * nolynch: Vote to not lynch this day
  * Must be used in the game thread.
  *
  * Game rules:
  *  - A vote can only be registered by a player in the game
  *  - A vote can only be registered by a living player
  *  - If a simple majority of players vote for no lynch:
  *    - The game enters the night phase
  *    - No information is revealed
  *
  * @example !nolynch
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.nolynchHandler = function (command) {
	const game = command.post.topic_id;
	const post = command.post.post_number;
	const voter = command.post.username;

	logDebug('Received nolynch request from ' + voter + ' in game ' + game);

	function getVoteAttemptText(success) {
		let text = '@' + command.post.username +  (success ? ' voted for ' : ' tried to vote for ') + 'no-lynch ';

		text = text	+ 'in post #<a href="https://what.thedailywtf.com/t/'
				+ command.post.topic_id + '/' + command.post.post_number + '">'
				+ command.post.post_number + '</a>.\n\n'
				+ 'Vote text:\n[quote]\n' + command.input + '\n[/quote]';
		return text;
	}
	
	/*Validation*/
	return dao.ensureGameExists(game)
		.then( () => dao.getGameStatus(game))
		.then((status) => {
			if (status === dao.gameStatus.running) {
				return Promise.resolve();
			}
			return Promise.reject('Incorrect game state: ' + status);
		})
		.then(() => verifyPlayerCanVote(game, voter))
		.then(() => revokeCurrentVote(game, voter, post))/* Revoke current vote, now a Controller responsibility */
		.then(() => dao.addActionWithoutTarget(game, post, voter, 'nolynch'))
		.then(() => {
			const text = getVoteAttemptText(true);
			view.respond(command, text);
			logDebug('Nolynch was successful');
			return true;
		})
		.catch((reason) => {
			/*Error handling*/
			return getVotingErrorText(reason, voter)
			.then((text) => {
				text += '\n<hr />\n';
				text += getVoteAttemptText(false);
				view.respond(command, text);
				logRecoveredError('Nolynch failed: ' + reason);
			});
		});
};

/**
  * unvote: Rescind previous vote without registering a new vote
  * Must be used in the game thread.
  *
  * Game rules:
  *  - An unvote can only occur if a vote has previously occurred
  *
  * @example !unvote
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.unvoteHandler = function (command) {
	const game = command.post.topic_id;
	const post = command.post.post_number;
	const voter = command.post.username;
	let target = undefined;

	logDebug('Received unvote request from ' + voter + ' in game ' + game);

	
	if (command.args.length > 0) {
		target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
	}
	
	function getVoteAttemptText(success) {
		let text = '@' + command.post.username + (success ? ' unvoted ' : ' tried to unvote ');

		text = text	+ 'in post #<a href="https://what.thedailywtf.com/t/'
				+ game + '/' + post + '">'
				+ post + '</a>.\n\n'
				+ 'Vote text:\n[quote]\n' + command.input + '\n[/quote]';
		return text;
	}
	
	/*Validation*/
	return dao.ensureGameExists(game)
		.then( () => dao.getGameStatus(game))
		.then((status) => {
			if (status === dao.gameStatus.running) {
				return Promise.resolve();
			}
			return Promise.reject('Incorrect game state: ' + status);
		})
		.then(() => verifyPlayerCanVote(game, voter))
		.then(() => {
			if (target) {
				return revokeCurrentVoteFor(game, voter, target, post);
			} else {
				return revokeCurrentVote(game, voter, post);
			}
		})/* Revoke current vote, now a Controller responsibility */
		.then(() => {
			const text = getVoteAttemptText(true);
			view.respond(command, text);
			logDebug('Unvote succeeded');
			return true;
		})
		.catch((reason) => {
			/*Error handling*/
			return getVotingErrorText(reason, voter)
			.then((text) => {
				text += '\n<hr />\n';
				text += getVoteAttemptText(false);
				view.respond(command, text);
				logDebug('Unvote failed: ' + reason);
			});
		});
};

/**
  * Vote: Vote to lynch a player
  * Must be used in the game thread. Expects one argument
  *
  * Game rules:
  *  - A vote can only be registered by a player in the game
  *  - A vote can only be registered by a living player
  *  - A vote can only be registered for a player in the game
  *  - A vote cna only be registered for a living player
  *  - If a simple majority of players vote for a single player:
  *    - The game enters the night phase
  *    - That player's information is revealed
  *
  * @example !vote playerName
  * @example !for playerName
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.voteHandler = function (command) {
	const game = command.post.topic_id;
	const post = command.post.post_number;
	const voter = command.post.username;
	// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
	// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
	const target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');

	logDebug('Received vote request from ' + voter + ' for ' + target + ' in game ' + game);

	
	return dao.getPlayerProperty(game, voter).then((property) => {
		if (property === dao.playerProperty.doubleVoter) {
			return doVote(game, post, voter, target, command.input, 2);
		} else {
			return doVote(game, post, voter, target, command.input, 1);
		}
	});
};

exports.forHandler = function (command) {
	const game = command.post.topic_id;
	const post = command.post.post_number;
	const voter = command.post.username;
	// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
	// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
	const target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');

	logDebug('Received vote request from ' + voter + ' for ' + target + ' in game ' + game);
	
	return doVote(game, post, voter, target, command.input, 1);
};

function doVote(game, post, voter, target, input, voteNum) {
	let action;
	if (voteNum === 2) {
		action = dao.action.dblVote;
	} else {
		action = dao.action.vote;
	}
			
	function getVoteAttemptText(success) {
		let text = '@' + voter + (success ? ' voted for ' : ' tried to vote for ') + '@' + target;

		text = text	+ ' in post #<a href="https://what.thedailywtf.com/t/'
				+ game + '/' + post + '">'
				+ post + '</a>.\n\n'
				+ 'Vote text:\n[quote]\n' + input + '\n[/quote]';
		return text;
	}
						
	return dao.ensureGameExists(game) /*Validation*/
		.then( () => dao.getGameStatus(game))
		.then((status) => {
			if (status === dao.gameStatus.running) {
				return Promise.resolve();
			}
			return Promise.reject('Incorrect game state: ' + status);
		})
		.then(() => verifyPlayerCanVote(game, voter))
		.then(() => {
			return Promise.all([
				validator.mustBeTrue(dao.isPlayerInGame, [game, target], 'Target not in game'),
				validator.mustBeTrue(dao.isPlayerAlive, [game, target], 'Target not alive')
			]);
		})     /* Revoke current vote, now a Controller responsibility */
		.then(() => revokeCurrentVote(game, voter, post, action))  /* Add new vote */
		.then(() => dao.addActionWithTarget(game, post, voter, action, target))
		.then((result) => {
			if (!result) {
				return Promise.reject('Vote failed');
			}
			
			const text = getVoteAttemptText(true);
			view.respondInThread(game, text);
			logDebug('Vote succeeded');
			return true;
		})
		.then(() => dao.getCurrentDay(game))   /*Check for auto-lynch*/
		.then((day) => {
			return Promise.join(
				dao.getNumToLynch(game),
				dao.getNumVotesForPlayer(game, day, target),
				dao.getPlayerProperty(game, target),
				function (numToLynch, numReceived, property) {
					if (property === 'loved') {
						numToLynch += 1;
					}
					if (property === 'hated') {
						numToLynch -= 1;
					}

					if (numToLynch <= numReceived) {
						return lynchPlayer(game, target);
					} else {
						return Promise.resolve();
					}
				}
			);
		})
		.catch((reason) => {
			/*Error handling*/
			return getVotingErrorText(reason, voter, target)
			.then((text) => {
				text += '\n<hr />\n';
				text += getVoteAttemptText(false);

				//Log error
				logRecoveredError('Vote failed: ' + reason);
				view.respondInThread(game, text);
			});
		});
}

/**
  * Join: Join a game
  * Must be used in the game thread.
  *
  * Game rules:
  *  - A player can only join a game that is in the Prep phase
  *  - A player can only join a game they are not already playing
  *
  * @example !join
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.joinHandler = function (command) {
	const id = command.post.topic_id;
	const player = command.post.username;

	logDebug('Received join request from ' + player + ' in game ' + id);
	
	return dao.ensureGameExists(id)
		.then(() => dao.getGameStatus(id))
		.then((status) => {
			if (status === dao.gameStatus.prep) {
				return Promise.resolve();
			}
			return Promise.reject('Cannot join game in progress.');
		})
		.then(() => validator.mustBeFalse(dao.isPlayerInGame, [id, player], 'You are already in this game, @' + player + '!'))
		.then(() => dao.addPlayerToGame(id, player))
		.then(() => view.respond(command, 'Welcome to the game, @' + player))
		.catch((err) => {
			view.reportError(command, 'Error when adding to game: ', err);
			logRecoveredError('Join failed ' + err);
		});
};

/**
  * List-players: List living players in the game
  * Must be used in the game thread.
  *
  * Game rules:
  *  - Only living players are included in this list
  *
  * @example !list-players
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.listPlayersHandler = function (command) {
	const id = command.post.topic_id;

	logDebug('Received list request from ' + command.post.username + ' in game ' + id);

	return dao.ensureGameExists(id)
		.then(() => dao.getAllPlayers(id))
		.then( (rows) => {
			let alive = [];
			const mods = [];

			rows.forEach((row) => {
				if (row.playerStatus === dao.playerStatus.alive) {
					alive.push(row.player.properName);
				}

				if (row.playerStatus === dao.playerStatus.mod) {
					mods.push(row.player.properName);
				}
			});

			const numLiving = alive.length;
			const numMods = mods.length;
			alive = shuffle(alive);

			let output = '##Player List\n';
			output += '###Living:\n';
			if (numLiving <= 0) {
				output += 'Nobody! Aren\'t you special?\n';
			} else {
				for (let i = 0; i < numLiving; i++) {
					output += '- ' + alive[i] + '\n';
				}
			}

			output += '###Mod(s):\n';
			if (numMods <= 0) {
				output += 'None. Weird.';
			} else {
				mods.forEach((mod) => {
					output += '- ' + mod + '\n';
				});
			}

			view.respond(command, output);
			return Promise.resolve();
		}).catch((err) => view.reportError(command, 'Error resolving list: ', err));
};

/**
  * List-all-players: List all players in the game
  * Must be used in the game thread.
  *
  * Game rules:
  *  - All players are included in this list
  *  - Player status must be indicated
  *
  * @example !list-all-players
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.listAllPlayersHandler = function (command) {
	const id = command.post.topic_id;

	logDebug('Received list all request from ' + command.post.username + ' in game ' + id);

	return dao.ensureGameExists(id)
	.then(() => dao.getAllPlayers(id))
	.then( (rows) => {
		let alive = [];
		let dead = [];
		const mods = [];

		rows.forEach((row) => {
			if (row.playerStatus === dao.playerStatus.alive) {
				alive.push(row.player.properName);
			} else if (row.playerStatus === dao.playerStatus.dead) {
				dead.push(row.player.properName);
			} else if (row.playerStatus === dao.playerStatus.mod) {
				mods.push(row.player.properName);
			}
		});

		const numLiving = alive.length;
		const numDead = dead.length;
		const numMod = mods.length;
		
		alive = shuffle(alive);
		dead = shuffle(dead);

		let output = '##Player List\n';
		output += '###Living:\n';
		if (numLiving <= 0) {
			output += 'Nobody! Aren\'t you special?\n';
		} else {
			for (let i = 0; i < numLiving; i++) {
				output += '- ' + alive[i] + '\n';
			}
		}

		output += '\n###Dead:\n';
		if (numDead <= 0) {
			output += 'Nobody! Aren\'t you special?\n';
		} else {
			for (let i = 0; i < numDead; i++) {
				output += '- ' + dead[i] + '\n';
			}
		}

		output += '###Mod(s):\n';
		if (numMod <= 0) {
			output += 'None. Weird.';
		} else {
			mods.forEach((mod) => {
				output += '- ' + mod + '\n';
			});
		}

		view.respond(command, output);
		return Promise.resolve();
	}).catch((err) => view.reportError(command, 'Error resolving list: ', err));
};

/**
  * List-votes: List votes for the current day
  * Must be used in the game thread.
  *
  * Game rules:
  *  - All votes must be included in this list, including rescinded votes
  *  - Rescinded votes must be indicated as such with a strikethrough
  *  - The post in which a vote was registered must be linked
  *  - The post in which a rescinded vote was rescinded must be linked
  *  - Votes must include the name of the voter
  *  - Only votes for the current day number shall be listed
  *
  * @example !list-votes
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.listVotesHandler = function (command) {
	const data = {
		day: 0,
		votes: {},
		numNotVoting: 0,
		notVoting: [],
		toExecute: 0
	};
	const id = command.post.topic_id;
	logDebug('Received list votes request from ' + command.post.username + ' in game ' + id);

	const currentlyVoting = [];

	
	return dao.ensureGameExists(id)
		.then(() => dao.getCurrentDay(id))
		.then((day) => {
			data.day = day;
			return dao.getNumToLynch(id);
		}).then((num) => {
			data.toExecute = num;
			return dao.getAllVotesForDaySorted(id, data.day);
		}).then((rows) => {
			rows.forEach((row) => {
				const votee = row.target.properName;
				const voter = row.player.properName;

				if (!data.votes.hasOwnProperty(votee)) {
					data.votes[votee] = {
						target: votee,
						num: 0,
						percent: 0,
						names: []
					};
				}

				if (row.isCurrent) {
					data.votes[votee].num++;
					data.votes[votee].percent = (data.votes[votee].num / data.toExecute) * 100;
					currentlyVoting.push(voter);
				}

				data.votes[votee].names.push({
					voter: voter,
					retracted: !row.isCurrent,
					retractedAt: row.rescindedAt,
					post: row.post,
					game: id
				});
			});
			
			return dao.getLivingPlayers(id);
		}).then((rows) => {
			const players = rows.map((row) => {
				return row.player.properName;
			});
			data.numPlayers = players.length;
			data.notVoting = players.filter((element) => {
				return currentlyVoting.indexOf(element) < 0;
			});
			data.notVoting = shuffle(data.notVoting);
			data.numNotVoting = data.notVoting.length;
			
			//Add modifiers
			const pendingLookups = [];
			let currLookup;
			players.forEach((target) => {
				if (data.votes.hasOwnProperty(target)) {
					currLookup = dao.getPlayerProperty(id, target).then((property) => {
						let mod;
						if (property === 'loved') {
							mod = 1;
						} else if (property === 'hated') {
							mod = -1;
						} else {
							mod = 0;
						}
						
						data.votes[target].mod = mod;
					});
					pendingLookups.push(currLookup);
				}
			});
			
			return Promise.all(pendingLookups);
		}).then(() => {
			view.respondWithTemplate('/templates/voteTemplate.handlebars', data, command);
		});
};

/**
  * List-all-votes: List votes since the beginning of the thread
  * Must be used in the game thread.
  *
  * Game rules:
  *  - All votes must be included in this list, including rescinded votes
  *  - Rescinded votes must be indicated as such with a strikethrough
  *  - The post in which a vote was registered must be linked
  *  - The post in which a rescinded vote was rescinded must be linked
  *  - Votes must include the name of the voter
  *  - Votes must be segregated by day
  *
  * @example !list-all-votes
  *
  * @param  {commands.command} command The command that was passed in.
  * @returns {Promise}        A promise that will resolve when the game is ready
  */
exports.listAllVotesHandler = function (command) {
	logDebug('Received list all votes request from ' + command.post.username + ' in game ' + command.post.topic_id);
	logDebug('List all votes is not yet implemented.');
	return Promise.resolve();
};
