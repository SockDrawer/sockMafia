'use strict';

const dao = require('./dao/index.js');
const validator = require('./validator');
const view = require('./view');
const Promise = require('bluebird');

const E_NOGAME = 'Error: No game';
let myName, myOwner, eventLogger;

/*exports.init = function(forum) {
	myName = forum.username;
	myOwner = forum.owner.username;
	eventLogger = forum;
};*/


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
		eventLogger.emit('logError', 'Unrecoverable error! ' + error.toString());
		eventLogger.emit('logError', error.stack);
	}
}

function logWarning(error) {
	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logWarning', error);
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

class MafiaPlayerController {
    constructor(d, config) {
        this.dao = d;
    };

	/**
	 * Helper method to lynch a player
	 * @param  {Number} game   The ID of the game
	 * @param  {String} target The player's name
	 * @returns {Promise}        A promise to complete the lynch
	 */
	lynchPlayer(game, target) {
		logDebug('Lynching target ' + target);

		return game.killPlayer(target)
			.then(() => game.nextPhase())
			.then(() => {
				const text = '@' + target.properName + ' has been lynched! Stay tuned for the flip.'
					+ ' <b>It is now Night.</b>';
				view.respondInThread(game.topicId, text);
			})
			.catch((error) => {
				const text = 'Error when lynching player: ' + error.toString();
				view.respondInThread(game.topicId, text);
			});
	}

	/*Voting helpers*/

	getNumVotesRequired(game, target) {
		const properties = target.getProperties();
		const numPlayers = game.livePlayers.length;
		let numToLynch = Math.ceil((numPlayers+1) / 2);

		if (properties.indexOf('loved') > -1) {
			numToLynch += 1;
		}
		if (properties.indexOf('hated') > -1) {
			numToLynch -= 1;
		}

		return numToLynch;
	}

	getVotingErrorText(reason, voter, target) {
		let text = ':wtf:';
		if (reason.toString().indexOf('Voter not in game') > -1) {
			text = '@' + voter + ': You are not yet a player.\n'
				+ 'Please use `@' + myName + ' join` to join the game.';
		} else if (reason.toString().indexOf('Voter not alive') > -1) {
			text = 'Aaagh! Ghosts!\n'
				+ '(@' + voter + ': You are no longer among the living.)';
		} else if (reason.toString().indexOf('Target not in game') > -1) {
			text = 'Who? I\'m sorry, @' + voter + ' but your princess is in another castle.\n'
				+ '(' + target + ' is not in this game.)';
		} else if (reason.toString().indexOf('Target not alive') > -1) {
			text = '@' + voter + ': You would be wise to not speak ill of the dead.';
		} else if (reason.toString().indexOf('Vote failed') > -1) {
			text = ':wtf:\nSorry, @' + voter + ': your vote failed.  No, I don\'t know why.'
				+ ' You\'ll have to ask @' + myOwner + ' about that.';
		} else {
			text += '\n' + reason;
		}
		return Promise.resolve(text);
	}


	checkForAutoLynch(game, target) {
		const todaysVotes = game.getActions();
		let numVotesForTarget = 0;
		for (let i = 0; i < todaysVotes.length; i++) {
			if (todaysVotes[i].isCurrent && todaysVotes[i].target.userslug === target.userslug) {
				numVotesForTarget++;
			}
		}
		const numVotesRequired = this.getNumVotesRequired(game, target);
		if (numVotesForTarget >= numVotesRequired) {
			return this.lynchPlayer(game, target);
		} else {
			return Promise.resolve();
		}
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
	/* eslint-disable */
	nolynchHandler (command) {
		const gameId = command.post.topic_id;
		const post = command.post.post_number;
		const actor = command.post.username;
		let voter, votee, game;

		logDebug('Received noLynch request from ' + voter + ' in game ' + game);
		
		function getVoteAttemptText(success) {
			let text = '@' + command.post.username + (success ? ' voted to not lynch ' : ' tried to vote to not lynch ');

			text = text	+ 'in post #<a href="https://what.thedailywtf.com/t/'
					+ game + '/' + post + '">'
					+ post + '</a>.\n\n'
					+ 'Vote text:\n[quote]\n' + command.input + '\n[/quote]';
			return text;
		}
		
		/*Validation*/
		return this.dao.getGameByTopicId(gameId)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw(E_NOGAME);
		})
		.then((g) => {
			game = g;
			try {
				voter = game.getPlayer(actor);
			} catch (_) {
				throw new Error('Voter not in game');
			}

			return this.verifyVotePreconditions(game, voter, null);
		})
		.then(() => game.registerAction(post, actor, undefined, 'vote'))
		.then(() => {
			const text = getVoteAttemptText(true);
			view.respond(command, text);
			logDebug('Nolynch vote succeeded');
			return true;
		})
		.catch((reason) => {
			if (reason === E_NOGAME) {
				return Promise.resolve();
			}

			/*Error handling*/
			return this.getVotingErrorText(reason, voter)
			.then((text) => {
				text += '\n<hr />\n';
				text += getVoteAttemptText(false);
				view.respond(command, text);
				logDebug('Nolynch failed: ' + reason);
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
	unvoteHandler (command) {
		const gameId = command.post.topic_id;
		const post = command.post.post_number;
		const actor = command.post.username;
		let target = undefined;
		let voter, votee, game;

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
		return this.dao.getGameByTopicId(gameId)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw(E_NOGAME);
		})
		.then((g) => {
			game = g;
			try {
				voter = game.getPlayer(actor);
			} catch (_) {
				throw new Error('Voter not in game');
			}

			if (target) {
				try {
					votee = game.getPlayer(target);
				} catch (_) {
					throw new Error('Target not in game');
				}
			} else {
				votee = null;
			}

			return this.verifyVotePreconditions(game, voter, votee);
		})
		.then(() =>	game.revokeAction(post, actor, target, 'vote'))
		.then(() => {
			const text = getVoteAttemptText(true);
			view.respond(command, text);
			logDebug('Unvote succeeded');
			return true;
		})
		.catch((reason) => {
			if (reason === E_NOGAME) {
				return Promise.resolve();
			}

			/*Error handling*/
			return this.getVotingErrorText(reason, voter)
			.then((text) => {
				text += '\n<hr />\n';
				text += getVoteAttemptText(false);
				view.respond(command, text);
				logDebug('Unvote failed: ' + reason);
			});
		});
	};
	/*eslint-enable*/

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
	voteHandler (command) {
		const gameId = command.post.topic_id;
		const game = this.dao.getGameByTopicId(command.post.topic_id);
		const post = command.post.post_number;
		const voter = command.post.username;
		// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
		// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
		const targetString = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');

		logDebug('Received vote request from ' + voter + ' for ' + targetString + ' in game ' + game);
		return this.doVote(gameId, post, voter, targetString, command.input, 1);

		//TODO: make doublevoter work
	/*	let target = game.getPlayer(targetString);
		let properties = target.getPlayerProperty();

		if (properties.indexOf('doublevoter') > -1) {
			return doVote(game, post, voter, target, command.input, 2);
		} else {
			return doVote(game, post, voter, target, command.input, 1);
		}*/
	};

	forHandler (command) {
		const game = command.post.topic_id;
		const post = command.post.post_number;
		const voter = command.post.username;
		// The following regex strips a preceding @ and captures up to either the end of input or one of [.!?, ].
		// I need to check the rules for names.  The latter part may work just by using `(\w*)` after the `@?`.
		const target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		logDebug('Received vote request from ' + voter + ' for ' + target + ' in game ' + game);
		
		return this.doVote(game, post, voter, target, command.input, 1);
	};

	verifyVotePreconditions (game, voter, target) {
		if (!game.isActive) {
			return Promise.reject('Incorrect game state');
		}

		if (!game.isDay) {
			return Promise.reject('It is not day.');
		}

		if (!voter.isAlive) {
			return Promise.reject('Voter not alive');
		}

		if (target && !target.isAlive) {
			return Promise.reject('Target not alive');
		}

		return Promise.resolve();
	}


	doVote (gameId, post, actor, target, input, voteNum) {
		let action, voter, votee, game;
		/*if (voteNum === 2) {
			action = dao.action.dblVote;
		} else {
			action = dao.action.vote;
		}*/

		function getVoteAttemptText(success) {
			let text = '@' + actor + (success ? ' voted for ' : ' tried to vote for ') + '@' + target;

			text = text	+ ' in post #<a href="https://what.thedailywtf.com/t/'
					+ game.name + '/' + post + '">'
					+ post + '</a>.\n\n'
					+ 'Vote text:\n[quote]\n' + input + '\n[/quote]';
			return text;
		}

		return this.dao.getGameByTopicId(gameId)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw(E_NOGAME);
		})
		.then((g) => {
			game = g;
			try {
				voter = game.getPlayer(actor);
			} catch (_) {
				throw new Error('Voter not in game');
			}

			try {
				votee = game.getPlayer(target);
			} catch (_) {
				throw new Error('Target not in game');
			}

			if (!votee) {
				throw new Error('No target specified');
			}

			return this.verifyVotePreconditions(game, voter, votee);
		})
		.then(() => game.registerAction(post, actor, target, 'vote'))
		.then(() => {
			const text = getVoteAttemptText(game, true);
			view.respondInThread(game, text);
			logDebug('Vote succeeded');
			return true;
		})
		.then(() => this.checkForAutoLynch(game, votee))
		.catch((reason) => {
			if (reason === E_NOGAME) {
				return Promise.resolve();
			}

			/*Error handling*/
			return this.getVotingErrorText(reason, voter, votee)
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
	joinHandler(command) {
		const id = command.post.topic_id;
		const player = command.post.username;

		logDebug('Received join request from ' + player + ' in game ' + id);
		
		return dao.ensureGameExists(id)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + id);
				throw(E_NOGAME);
			})
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
				if (err === E_NOGAME) {
					return Promise.resolve();
				}

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
	listPlayersHandler (command) {
		const id = command.post.topic_id;

		logDebug('Received list request from ' + command.post.username + ' in game ' + id);

		return dao.ensureGameExists(id)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + id);
				throw(E_NOGAME);
			})
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
			}).catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}
				view.reportError(command, 'Error resolving list: ', err);
			});
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
	listAllPlayersHandler(command) {
		const id = command.post.topic_id;

		logDebug('Received list all request from ' + command.post.username + ' in game ' + id);

		return dao.ensureGameExists(id)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + id);
			throw(E_NOGAME);
		})
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
		}).catch((err) => {
			if (err === E_NOGAME) {
				return Promise.resolve();
			}
			view.reportError(command, 'Error resolving list: ', err);
		});
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
	listVotesHandler(command) {
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
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + id);
				throw E_NOGAME;
			})
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
				return view.respondWithTemplate('/templates/voteTemplate.handlebars', data, command);
			})
			.catch((reason) => {
				if (reason === E_NOGAME) {
					return Promise.resolve();
				}
				return view.reportError(command, 'Error reporting votes: ', reason);
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
	listAllVotesHandler (command) {
		logDebug('Received list all votes request from ' + command.post.username + ' in game ' + command.post.topic_id);
		logDebug('List all votes is not yet implemented.');
		return Promise.resolve();
	};
};

module.exports = MafiaPlayerController;
