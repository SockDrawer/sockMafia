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
				const text = '@' + target.username + ' has been lynched! Stay tuned for the flip.'
					+ ' <b>It is now Night.</b>';
				view.respondInThread(game.topicId, text);
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
		const numPlayers = game.livePlayers.length;
		let numToLynch = Math.ceil((numPlayers + 1) / 2);

		if (target) {
			numToLynch += this.getVoteModifierForTarget(game, target);
		}

		return numToLynch;
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

	getVoteAttemptText(actor, action, thread, post, input) {
		const url = this.formatter.urlForPost(post);

		const text = `@${actor} ${action} in post <a href="${url}">${post}</a>`
				+ '\n\n'
				+ `Original input:\n ${this.formatter.quoteText(input, actor, url)}\n`;
		return text;
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
	
	getGame (command) {
		return command.getTopic().then((topic) => {
			if (topic.id === -1) {
				//Command came from a chat
				return this.dao.getGameByChatId(command.parent.ids[0]);
			} else {
				return this.dao.getGameByTopicId(topic.id);
			}
		});
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
		let gameId, post, actor, voter, votee, game;


		/*Validation*/
		return this.getGame(command)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw(E_NOGAME);
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
	unvoteHandler (command) {
		let gameId, post, actor, target, voter, votee, game;

		if (command.args.length > 0) {
			target = command.args[0].replace(/^@?(.*?)[.!?, ]?/, '$1');
		}

		/*Validation*/

		return this.getGame(command)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw(E_NOGAME);
		})
		.then((g) => {
			game = g;
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
		.then(() =>	game.revokeAction(post, actor, target, 'vote', 'vote'))
		.then(() =>	game.revokeAction(post, actor, target, 'vote', 'doubleVote')) //Just in case
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
		let gameId, voter, game;
		let voteNum = 1;
		
		if (command.args[0] && command.args[0].toLowerCase() === 'for') {
			command.args.shift();
		}

		const targetString = command.args[0] ? command.args[0].replace('@', '') : '';

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

	forHandler (command) {
		let gameId, voter;

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


	doVote (gameId, post, actor, target, input, voteNum, command) {
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
		let game, gameId, player;

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
		}).then((u) => {
			player = u.username;
			logDebug('Received join request from ' + player + ' in game ' + gameId);

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
	listPlayersHandler (command) {
		let game, id;

		return this.getGame(command)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw (E_NOGAME);
		})
		.then((g) => {
			game = g;
			logDebug('Received list request in game ' + id);
			return command.getTopic();
		}).then((topic) => {
			id = topic.id;
		
			//Store a reference otherwise it'll shuffle every time we dip
			const alive = game.livePlayers;
			const mods =  game.moderators;

			const numLiving = alive.length;
			const numMods = mods.length;

			let output = '## Player List\n';
			output += '### Living:\n';
			if (numLiving <= 0) {
				output += 'Nobody! Aren\'t you special?\n';
			} else {
				for (let i = 0; i < numLiving; i++) {
					output += '- ' + alive[i].username + '\n';
				}
			}

			output += '### Mod(s):\n';
			if (numMods <= 0) {
				output += 'None. Weird.';
			} else {
				mods.forEach((mod) => {
					output += '- ' + mod.username + '\n';
				});
			}

			view.respond(command, output);
			return Promise.resolve();
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
		let game, id;

		return this.getGame(command)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw (E_NOGAME);
		})
		.then((g) => {
			game = g;
			logDebug('Received list request in game ' + id);
			return command.getTopic();
		}).then((topic) => {
			id = topic.id;
			//Store a reference otherwise it'll shuffle every time we dip
			const alive = game.livePlayers;
			const mods =  game.moderators;
			const dead = game.deadPlayers;

			const numLiving = alive.length;
			const numDead = dead.length;
			const numMods = mods.length;

			let output = '## Player List\n';
			output += '### Living:\n';
			if (numLiving <= 0) {
				output += 'Nobody! Aren\'t you special?\n';
			} else {
				for (let i = 0; i < numLiving; i++) {
					output += '- ' + alive[i].username + '\n';
				}
			}

			output += '\n### Dead:\n';
			if (numDead <= 0) {
				output += 'Nobody! Aren\'t you special?\n';
			} else {
				for (let i = 0; i < numDead; i++) {
					output += '- ' + dead[i].username + '\n';
				}
			}

			output += '### Mod(s):\n';
			if (numMods <= 0) {
				output += 'None. Weird.';
			} else {
				mods.forEach((mod) => {
					output += '- ' + mod.username + '\n';
				});
			}

			view.respond(command, output);
			return Promise.resolve();
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
			toExecute: 0
		};


		let game, id;
		return this.getGame(command)
		.catch(() => {
			logWarning('Ignoring message in nonexistant game thread ' + game);
			throw (E_NOGAME);
		})
		.then((g) => {
			game = g;
			return command.getTopic();
		}).then((topic) => {
			id = topic.id;
			return this.dao.getGameByTopicId(id).catch(() => {
				logWarning('Ignoring message in nonexistant game thread ' + game);
				throw (E_NOGAME);
			});
		})
		.then((g) => {
			game = g;

			logDebug('Received list request in game ' + id);

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
			return view.respondWithTemplate('/templates/voteTemplate.handlebars', data, command);
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
	targetHandler (command) {
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

			return command.getPost();
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
