'use strict';

/**
 * sockMafia Player controller
 * @module sockmafia.MafiaPlayerController
 * @author Yamikuronue
 * @license MIT
 */

const view = require('./view');
const Promise = require('bluebird');
const debug = require('debug')('sockbot:mafia:playerController');
const Utils = require('./utils');

const E_NOGAME = 'Error: No game';
let myName, myOwner, eventLogger;



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
	debug(statement);

	if (eventLogger && eventLogger.emit) {
		eventLogger.emit('logExtended', 5, statement);
	}
}

class MafiaPlayerController {
	/**
	 * The constructor
	 * @param  {sockmafia.src.dao.MafiaDao} d      The dao to use to persist the data
	 */
	constructor(d) {
		this.dao = d;
		this.formatter = undefined;
	}

	/**
	 * Activation function for the plugin
	 * @param   {Forum} forum The forum object to activate for
	 */
	activate(forum) {
		//Set name
		myName = forum.username;
		this.formatter = forum.Format;
		this.forum = forum; // we need this for laters

		//Register commandss
		forum.Commands.add('list-players', 'list all players still alive', this.listPlayersHandler.bind(this));
		forum.Commands.addAlias('listplayers', this.listPlayersHandler.bind(this));

		forum.Commands.add('list-all-players', 'list all players, dead and alive', this.listAllPlayersHandler.bind(this));
		forum.Commands.addAlias('listallplayers', this.listAllPlayersHandler.bind(this));

		forum.Commands.add('join', 'join current mafia game', this.joinHandler.bind(this));
		forum.Commands.add('for', 'vote for a player to be executed', this.forHandler.bind(this));
		forum.Commands.add('vote', 'vote for a player to be executed (alt. form)', this.voteHandler.bind(this));

		forum.Commands.add('list-votes', 'list all votes from the day\'s start', this.listVotesHandler.bind(this));
		forum.Commands.addAlias('listvotes', this.listVotesHandler.bind(this));

		forum.Commands.add('unvote', 'rescind your vote', this.unvoteHandler.bind(this));
		forum.Commands.add('nolynch', 'vote for noone to be lynched', this.nolynchHandler.bind(this));
		forum.Commands.addAlias('no-lynch', this.nolynchHandler.bind(this));

		forum.Commands.add('target', 'Target a player with any night action you may have', this.targetHandler.bind(this));

		forum.Commands.add('chat', 'Create a private chat with a player (and game mods)', this.createChatHandler.bind(this));
		forum.Commands.addAlias('say', this.createChatHandler.bind(this));
		forum.Commands.addAlias('whisper', this.createChatHandler.bind(this));
	}

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
				const text = '@' + target.username + ' has been lynched! Stay tuned for the flip.' +
					' <b>It is now Night.</b>';
				view.respondInThread(game.topicId, text);
				this.forum.emit('mafia:playerLynched', target.username);
			})
			.catch((error) => {
				const text = 'Error when lynching player: ' + error.toString();
				view.respondInThread(game.topicId, text);
			});
	}

	/*Voting helpers*/

	/**
	 * Get the number of votes required to lynch a player
	 *
	 * Game rules:
	 * - A single player must obtain a simple majority of votes in order to be lynched
	 * - Loved and Hated players are exceptions to this rule.
	 *
	 * @param   {sockmafia.src.dao.MafiaGame} game   The game in which the votes are being tabulated
	 * @param   {sockmafia.src.dao.MafiaUser} target The target's name
	 * @returns {number}        The number needed to lynch
	 */
	getNumVotesRequired(game, target) {
		return Utils.getNumVotesRequired(game, target);
	}

	/**
	 * Get the vote modifier for a given target.
	 *
	 * Game rules:
	 * - A loved player requires one extra vote to lynch
	 * - A hated player requires one fewer vote to lynch
	 * @param   {sockmafia.src.dao.MafiaGame} game   The game in which the votes are being tabulated
	 * @param   {sockmafia.src.dao.MafiaUser} target The user to tabulate for
	 * @returns {Number}        A modifier. +1 means that the user is loved, -1 means they are hated
	 */
	getVoteModifierForTarget(game, target) {
		if (!target) {
			return 0;
		}

		if (target.hasProperty('loved')) {
			return 1;
		}
		if (target.hasProperty('hated')) {
			return -1;
		}
		return 0;
	}

	/**
	 * Get the text for a voting attempt. A helper method, no game rules.
	 *
	 * @param   {String} actor   Who is voting
	 * @param   {String} action  Did they vote, unvote, et cetera
	 * @param   {String} thread  Where did they vote
	 * @param   {String} post    the postID where the action took place
	 * @param   {String} input   their ogiginal input
	 *
	 * @returns	{String} The text to output
	 */
	getVoteAttemptText(actor, action, thread, post, input) {
		const url = this.formatter.urlForPost(post);

		const text = `@${actor} ${action} in post <a href="${url}">${post}</a>` +
			'\n\n' +
			`Original input:\n ${this.formatter.quoteText(input, actor, url)}\n`;
		return text;
	}

	/**
	 * Get the flavor-ized error text when a vote errors. For standardization across voting methods
	 * @param   {Error} reason   The reason to process
	 * @param   {String} voter   The voter's name
	 * @param   {String} target  Who they tried to vote for
	 * @returns {Promise}        A promise that resolves to the text
	 */
	getVotingErrorText(reason, voter, target) {
		let text = ':wtf:';
		if (reason.toString().indexOf('Voter not in game') > -1) {
			text = '@' + voter + ': You are not yet a player.\n' +
				'Please use `@' + myName + ' join` to join the game.';
		} else if (reason.toString().indexOf('Voter not alive') > -1) {
			text = 'Aaagh! Ghosts!\n' +
				'(@' + voter + ': You are no longer among the living.)';
		} else if (reason.toString().indexOf('Target not in game') > -1) {
			text = 'Who? I\'m sorry, @' + voter + ' but your princess is in another castle.\n' +
				'(' + target + ' is not in this game.)';
		} else if (reason.toString().indexOf('Target not alive') > -1) {
			text = '@' + voter + ': You would be wise to not speak ill of the dead.';
		} else if (reason.toString().indexOf('Vote failed') > -1) {
			text = ':wtf:\nSorry, @' + voter + ': your vote failed.  No, I don\'t know why.' +
				' You\'ll have to ask @' + myOwner + ' about that.';
		} else {
			text += '\n' + reason;
		}
		return Promise.resolve(text);
	}

	/**
	 * Check to see if a lynch should happen. 
	 * Game rules:
	 *  - If a simple majority of players vote for a single player:
	 *    - The game enters the night phase
	 *    - That player's information is revealed
	 *    
	 * @param   {MafiaGame}   game   The game 
	 * @param   {MafiaPlayer} target The person why may be lynched
	 * @returns {Promise}        A promise that resolves when the lynch is done or not required
	 */
	checkForAutoLynch(game, target) {
		const todaysVotes = game.getActions();

		if (target.hasProperty('lynchproof')) {
			return Promise.resolve();
		}

		let numVotesForTarget = 0;
		for (let i = 0; i < todaysVotes.length; i++) {
			const voteTarget = todaysVotes[i].target && todaysVotes[i].target.userslug;
			if (todaysVotes[i].isCurrent && voteTarget === target.userslug) {
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


	verifyVotePreconditions(game, voter, target) {
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

	getGame(command) {
		//First check for 'in soandso' syntax
		for (let i = 0; i < command.args.length; i++) {
			if (command.args[i].toLowerCase() === 'in' && command.args[i + 1]) {
				const target = command.args.slice(i + 1, command.args.length).join(' ');
				if (Utils.isNumeric(target)) {
					return this.dao.getGameByTopicId(target);
				} else {
					return this.dao.getGameByName(target);
				}
			}
		}
		
		if (command.parent.ids.topic === -1) {
			//Command came from a chat
			return this.dao.getGameByChatId(command.parent.ids.pm);
		} else {
			return this.dao.getGameByTopicId(command.parent.ids.topic);
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
	nolynchHandler(command) {
		let gameId, post, actor, voter, votee, game;


		/*Validation*/
		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				return command.getTopic();
			}).then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				actor = user.username;
				logDebug('Received noLynch request from ' + voter + ' in game ' + game);
				return command.getPost();
			}).then((p) => {
				post = p.id;
				try {
					voter = game.getPlayer(actor);
				} catch (_) {
					throw new Error('Voter not in game');
				}
				return this.verifyVotePreconditions(game, voter, null);
			})
			.then(() => game.registerAction(post, actor, undefined, 'vote'))
			.then(() => {
				const text = this.getVoteAttemptText(actor, 'voted to not lynch', gameId, post, command.line);
				view.respond(command, text);
				logDebug('Nolynch vote succeeded');
				return true;
			}) /*TODO: check for successufl no-lynch*/
			.catch((reason) => {
				if (reason === E_NOGAME) {
					return Promise.resolve();
				}

				/*Error handling*/
				return this.getVotingErrorText(reason, actor)
					.then((text) => {
						text += '\n<hr />\n';
						text += this.getVoteAttemptText(actor, 'tried to vote to not lynch', gameId, post, command.line);
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
	unvoteHandler(command) {
		let gameId, post, actor, target, voter, votee, game;

		if (command.args.length > 0) {
			target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		}

		/*Validation*/

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;

				if (command.parent.ids.topic === -1) {
					throw new Error('Hey1 No secret unvoting! Use a public thread.');
				}
				return command.getUser();
			}).then((user) => {
				actor = user.username;
				logDebug('Received unvote request from ' + actor + ' in game ' + gameId);
				return command.getPost();
			}).then((p) => {
				post = p.id;
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
			.then(() => game.revokeAction(post, actor, target, 'vote', 'vote'))
			.then(() => game.revokeAction(post, actor, target, 'vote', 'doubleVote')) //Just in case
			.then(() => {
				const text = this.getVoteAttemptText(actor, 'unvoted', gameId, post, command.line);
				view.respond(command, text);
				logDebug('Unvote succeeded');
				return true;
			})
			.catch((reason) => {
				if (reason === E_NOGAME) {
					return Promise.resolve();
				}

				/*Error handling*/
				return this.getVotingErrorText(reason, actor)
					.then((text) => {
						text += '\n<hr />\n';
						text += this.getVoteAttemptText(actor, 'tried to unvote', gameId, post, command.line);
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
	 *  - If a voter is not a doublevoter, this does not differ from For. If they are, this is a separate vote
	 *  - After a vote, a lynch may be required
	 *
	 * @example !vote playerName
	 * @example !for playerName
	 *
	 * @param  {commands.command} command The command that was passed in.
	 * @returns {Promise}        A promise that will resolve when the game is ready
	 */
	voteHandler(command) {
		let gameId, voter, game;
		let voteNum = 1;

		if (command.args[0] && command.args[0].toLowerCase() === 'for') {
			command.args.shift();
		}

		const targetString = command.args[0] ? command.args[0].replace('@', '') : '';

		if (command.parent.ids.topic === -1) {
			return view.reportError(command, '', 'You cannot vote in private!');
		}

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				return command.getTopic();
			}).then((topic) => {
				gameId = topic.id;
				return command.getUser();
			}).then((user) => {
				voter = user.username;
				return game.getPlayer(voter);
			}).then((player) => {
				if (player.hasProperty('doublevoter')) {
					voteNum = 2;
				}
				return command.getPost();
			}).then((post) => {
				if (command.args.length <= 0) {
					return this.getVotingErrorText('No target specified', voter, '')
						.then((text) => {

							text += '\n<hr />\n';
							text += this.getVoteAttemptText(voter, 'tried to vote', gameId, post.id, command.line);

							//Log error
							logRecoveredError('Vote failed: No target specified');

							return view.reportError(command, '', text);
						});
				}

				logDebug('Received vote request from ' + voter + ' for ' + targetString + ' in game ' + gameId);


				return this.doVote(gameId, post.id, voter, targetString, command.line, voteNum, command);
			}).catch((reason) => {
				if (reason === E_NOGAME) {
					return Promise.resolve();
				}


				/*Error handling*/
				return command.getPost().then((post) => {
					return this.getVotingErrorText(reason, voter, targetString)
						.then((text) => {

							text += '\n<hr />\n';
							text += this.getVoteAttemptText(voter, 'tried to vote for @' + targetString, gameId, post, command.line);

							//Log error
							logRecoveredError('Vote failed: ' + reason);

							return view.reportError(command, '', text);
						});
				});
			});
	}

	/**
	 * For: Vote to lynch a player
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
	forHandler(command) {
		let gameId, voter;

		if (command.parent.ids.topic === -1) {
			return view.reportError(command, '', 'You cannot vote in private!');
		}

		return command.getTopic().then((topic) => {
			gameId = topic.id;
			return command.getUser();
		}).then((user) => {
			voter = user.username;
			return command.getPost();
		}).then((post) => {
			if (command.args.length <= 0) {
				return this.getVotingErrorText('No target specified', voter, '')
					.then((text) => {

						text += '\n<hr />\n';
						text += this.getVoteAttemptText(voter, 'tried to vote', gameId, post.id, command.line);

						//Log error
						logRecoveredError('Vote failed: No target specified');

						return view.reportError(command, '', text);
					});
			}

			const targetString = command.args[0] ? command.args[0].replace('@', '') : '';

			logDebug('Received vote request from ' + voter + ' for ' + targetString + ' in game ' + gameId);

			return this.doVote(gameId, post.id, voter, targetString, command.line, 1, command);
		});
	}

	doVote(gameId, post, actor, target, input, voteNum, command) {
		let voter, votee, game;

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
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
			.then(() => {
				return game.registerAction(post, actor, target, 'vote', voteNum > 1 ? 'doubleVote' : 'vote');
			})
			.then(() => {
				const text = this.getVoteAttemptText(actor, 'voted for @' + target, gameId, post, input);
				logDebug('Vote succeeded');
				return view.respond(command, text);
			})
			.then(() => this.checkForAutoLynch(game, votee))
			.catch((reason) => {
				if (reason === E_NOGAME) {
					return Promise.resolve();
				}


				/*Error handling*/
				return this.getVotingErrorText(reason, actor, target)
					.then((text) => {

						text += '\n<hr />\n';
						text += this.getVoteAttemptText(actor, 'tried to vote for @' + target, gameId, post, input);

						//Log error
						logRecoveredError('Vote failed: ' + reason);

						return view.reportError(command, '', text);
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
		let game, player;

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread');
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				return command.getUser();
			}).then((u) => {
				player = u.username;
				logDebug('Received join request from ' + player + ' to ' + game.name);

				if (game.isActive) {
					return Promise.reject('Cannot join game in progress.');
				}
				if (game.allPlayers.map((p) => p.username).indexOf(player) >= 0) {
					return Promise.reject('You are already in this game, @' + player + '!');
				}
				return game.addPlayer(player);
			})
			.then(() => {
				view.respond(command, 'Welcome to the game, @' + player);
				logDebug('Added ' + player);
				return true;
			})
			.catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}

				view.reportError(command, 'Error when adding to game: ', err);
				logRecoveredError('Join failed ' + err);
			});
	}

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
	listPlayersHandler(command) {
		let game;

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread');
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				logDebug('Received list request in game ' + game.name);

				//Store a reference otherwise it'll shuffle every time we dip
				const alive = game.livePlayers;
				const mods = game.moderators;

				
				logDebug('List resolved');
				return view.respondWithTemplate('listPlayers.handlebars', 
				{
					alive: alive,
					mods: mods,
					showdead: false
				},
				command);
			})
			.catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}

				view.reportError(command, 'Error resolving list: ', err);
				logRecoveredError('List failed ' + err);
				return Promise.resolve();
			});
	}

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
		let game;

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread');
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				logDebug('Received list request in game ' + game.name);
				//Store a reference otherwise it'll shuffle every time we dip
				const alive = game.livePlayers;
				const mods = game.moderators;
				const dead = game.deadPlayers;

				logDebug('List resolved');
				return view.respondWithTemplate('listPlayers.handlebars', 
				{
					alive: alive,
					mods: mods,
					dead: dead,
					showdead: true
				},
				command);
			})
			.catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}

				view.reportError(command, 'Error resolving list: ', err);
				logRecoveredError('List failed ' + err);
			});
	}

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
			toExecute: 0,
			barStyle: ''
		};


		let game, id;
		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;

				logDebug('Received list request in game ' + game.name);

				data.barStyle = game.getValue('voteBars');
				data.toExecute = this.getNumVotesRequired(game);
				data.day = game.day;

				const phaseEnd = game.getValue('phaseEnd');
				if (phaseEnd) {
					data.endTime = phaseEnd;
					data.showEndTime = true;
				} else {
					data.showEndTime = false;
				}

				const actions = game.getActions(); //default settings are fine
				const currentlyVoting = [];

				actions.forEach((row) => {
					if (row.action !== 'vote') {
						return;
					}

					let votee = row.target ? row.target.username : undefined;
					const voter = row.actor.username;

					const mod = this.getVoteModifierForTarget(game, row.target);

					if (!votee) {
						votee = 'No lynch';
					}
					if (!data.votes.hasOwnProperty(votee)) {
						data.votes[votee] = {
							target: votee,
							num: 0,
							percent: 0,
							votes: [],
							mod: mod
						};
					}

					if (row.isCurrent) {
						data.votes[votee].num++;
						data.votes[votee].percent = (data.votes[votee].num / data.toExecute) * 100;
						currentlyVoting.push(voter);
					}

					/*data.votes[votee].votes.push({
						voter: voter,
						retracted: !row.isCurrent,
						retractedAt: row.revokedId,
						post: row.postId,
						game: id
					});*/

					data.votes[votee].votes.push(row);
				});

				game.livePlayers.forEach((p) => {
					if (currentlyVoting.indexOf(p.username) === -1) {
						data.notVoting.push(p.username);
						data.numNotVoting++;
					}
				});

				data.numPlayers = game.livePlayers.length;
				return view.respondWithTemplate('voteTemplate.handlebars', data, command);
			})
			.catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}
				debug(err);
				view.reportError(command, 'Error resolving list: ', err);
				logRecoveredError('List failed ' + err);
			});
	}

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
	listAllVotesHandler(command) {
		logDebug('Received list all votes request from ' + command.post.username + ' in game ' + command.post.topic_id);
		logDebug('List all votes is not yet implemented.');
		return Promise.resolve();
	}

	/**
	 * chat: Open a chat with the targets and Game Mods.
	 *
	 * Game rules:
	 * - Chats must be enabled in game config
	 *
	 * @example !chat with yamikuronue in Mafia8
	 * @example !chat Yamikuronue in Mafia8
	 *
	 * @param  {commands.command} command The command that was passed in.
	 * @returns {Promise}        A promise that will resolve when the game is ready
	 */
	createChatHandler(command) {
		
		if ('with' === (command.args[0] || '').toLowerCase()) {
			command.args.shift();
		}
		if ('to' === (command.args[0] || '').toLowerCase()) {
			command.args.shift();
		}
		
		let target = command.args.shift();
		//const gameName = Utils.argParse(command.args, []) || command.parent.ids.topic;
		
		
		if (!target) {
			command.reply('Invalid command: Usage `!chat with somePlayer`');
			return Promise.resolve();
		}
		
		if (target.startsWith('@')) {
			target = target.replace('@', '');
		}
		let game = null;
		let postmanToggle;
		let user;
		
		
		return Promise.all([
				this.getGame(command),
				command.getUser()
			])
			.then((data) => {
				game = data[0],
				user = data[1];
				const targets = game.moderators.map((mod) => mod.username);
				if (!Utils.isEnabled(game.getValue('chats'))) {
					throw new Error('Chats are not enabled for this game');
				}
				
				postmanToggle = game.getValue('postman');
				let originator;
				try {
					originator = game.getPlayer(user.username).username;
					debug('Postman sender: ' + originator);
				} catch (usererr) {
					debug('Error determining chat originator', usererr);
					throw new Error('You are not a living player in this game');
				}
				
				if (!postmanToggle || postmanToggle.toLowerCase() === 'off') {
					targets.unshift(originator);
				}
				
				try {
					targets.unshift(game.getPlayer(target).username);
					debug('Chat target: ' + game.getPlayer(target).username);
				} catch (targeterr) {
					debug('Error determining chat target', targeterr);
					throw new Error(`'${target}' is not a living player in this game`);
				}
				
				return Promise.all(targets.map((t) => this.forum.User.getByName(t)));
			}).then((targets) => {
				const title = `Sanctioned chat for ${game.name}`,
					message = `This is an officially sanctioned chat for ${game.name}`;
	
				//Attempt to re-use chats.
				if (postmanToggle === 'on' 
				|| postmanToggle === 'open') {
					let existingChats = game.getValue('postman_chats');
					if (!existingChats) {
						existingChats = {};
					}
					
					if (existingChats[target]) {
						debug('Reusing existing chat: ' + existingChats[target]);
						
						return this.forum.Chat.get(existingChats[target]);
					} else {
						debug('creating chat');
						debug('targets: ' + targets);
						debug('message: ' + message);
						debug('title: ' + title);
						return this.forum.Chat.create(targets, message, title).then((chatroom) => {
							existingChats[target] = chatroom.id;
							game.setValue('postman_chats', existingChats);
							return Promise.resolve(chatroom);
						});
					}
				}
				
				return this.forum.Chat.create(targets, message, title);
			})
			.then((chatroom) => {
				debug(chatroom);
				game.addChat(chatroom.id);
				if (postmanToggle && postmanToggle.toLowerCase() !== 'off') {
					let message = command.args.join(' ');
					const sender = postmanToggle.toLowerCase() === 'open' ? user.username : 'Someone';
					message = `${sender} said: ${message}`;
					
					return chatroom.send(message).then(() => {
						//Split on commas, but filter out any empty strings (falsey values)
						const ccValue = (game.getValue('postman-cc') ? game.getValue('postman-cc').toString() : '').split(',').filter((cc)=>cc);
						
						if (ccValue.length > 0) {
							const promises = ccValue.map((val) => {
								return view.respondInThread(val, `Message sent from ${user.username} to ${target}: \n${message}`);
							});
							return Promise.all(promises);
						} else {
							return Promise.resolve();
						}
					}).then(() => {
						const publicValue = game.getValue('postman-public');
						if (publicValue.toLowerCase() === 'on' || publicValue.toLowerCase() === game.phase.toLowerCase()) {
							return view.respondInThread(game.topicId, `Delivered mail from ${user.username} to ${target}`);
						} else {
							return Promise.resolve();
						}
					});
				}
			})
			.then(() => command.reply(`Started chat between ${user.username} and ${target} in ${game.name}`))
			.catch((err) => {
				debug('Error ocurred creating chat', err);
				command.reply(`Error creating chat: ${err}`);
			});
	}

	/**
	 * Target: target another player as the recipient of a night action.
	 *
	 * Game rules:
	 * - A target selection by any member of a scum faction counts for the whole faction,
	 *	and revokes any previous target action
	 * - Only the cult leader can target a member of the cult
	 * - Any other type of player's target action should revoke any previous action by that player
	 *
	 * @example !target 123 yamikuronue
	 * @example !target testMafia yamikuronue
	 *
	 * @param  {commands.command} command The command that was passed in.
	 * @returns {Promise}        A promise that will resolve when the game is ready
	 */
	targetHandler(command) {
		let actor, target, game;
		const targetString = command.args[0] ? command.args[0].replace('@', '') : '';

		return this.getGame(command)
			.catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			})
			.then((g) => {
				game = g;
				return command.getUser();
			}).then((user) => {
				try {
					actor = game.getPlayer(user.username);
				} catch (e) {
					throw new Error('You are not playing in ' + game.name);
				}


				try {
					target = game.getPlayer(targetString);
				} catch (e) {
					throw new Error('Target is invalid');
				}


				try {
					target = game.getPlayer(targetString);
				} catch (e) {
					throw new Error('Target is invalid');
				}

				return command.getPost().catch(() => {
					//So we tried to get a post and failed
					//The most common reason for that is that 
					//there is no post. Which means we're in a chat.
					//So return a pseudo object with the chat ID.
					//Why not a real chat? They can't be retrieved by ID
					//which is also why we can't just call command.getChat()
					return {id: command.parent.ids.chat};
				});
			}).then((post) => {
				let actionToken = 'target';

				/* Group types*/
				if (actor.hasProperty('scum') || actor.hasProperty('mafia')) {
					//Revoke previous scum action
					const prevAction = game.getActionOfType('target', null, 'scum');
					if (prevAction) {
						prevAction.revoke(post.id);
					}
					actionToken = 'scum';
				}

				if (actor.hasProperty('scum2')) {
					//Revoke previous scum action
					const prevAction = game.getActionOfType('target', null, 'scum2');
					if (prevAction) {
						prevAction.revoke(post.id);
					}
					actionToken = 'scum2';
				}

				if (actor.hasProperty('cultLeader')) {
					actionToken = 'cult';
				}
				return game.registerAction(post.id, actor.username, target.username, 'target', actionToken);
			}).then(() => command.reply('Action recorded.'))
			.catch((err) => {
				if (err === E_NOGAME) {
					return Promise.resolve();
				}

				view.reportError(command, 'Error recording action: ', err);
				logRecoveredError('List failed ' + err);
			});
	}
}

module.exports = MafiaPlayerController;
