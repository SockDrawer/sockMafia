'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
require('chai-as-promised');
chai.use(require('sinon-chai'));

chai.should();

const PlayerController = require('../../src/player_controller');
const view = require('../../src/view.js');
const Utils = require('../../src/utils');

const browser = {
	createPost: sinon.stub().yields()
};

describe('player controller', () => {

	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		browser.createPost.reset();
	});
	afterEach(() => {
		sandbox.restore();
	});

	describe('getGame', () => {
		let mockGame, mockdao, playerController;

		beforeEach(() => {
			mockGame = {
				getAllPlayers: () => 1,
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				topicId: 12,
				isActive: true,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			playerController = new PlayerController(mockdao, null);
		});

		it('should get a game by chat id', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: -1
				}),
				parent: {
					ids: {
						topic: -1,
						chat: 12
					}
				},
				args: []
			};
			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByChatId');
			return playerController.getGame(command).then((game) => {
				game.should.deep.equal(mockGame);
				mockdao.getGameByChatId.calledWith(12).should.be.true;
			});
		});

		it('should get a game by topic id', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 1234
				}),
				parent: {
					ids: {
						topic: 1234
					}
				},
				args: []
			};
			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByChatId');
			return playerController.getGame(command).then((game) => {
				game.should.deep.equal(mockGame);
				mockdao.getGameByTopicId.calledWith(1234).should.be.true;
			});
		});

	});

	describe('Vote helpers', () => {
		let mockGame, mockUser, mockTarget, playerController;

		beforeEach(() => {
			mockGame = {
				getAllPlayers: () => 1,
				killPlayer: () => 1,
				nextPhase: () => 1,
				getActions: () => 1,
				topicId: 12,
				livePlayers: []
			};

			mockUser = {
				username: 'Lars',
				userslug: 'lars',
				hasProperty: () => false,
				isAlive: true
			};

			mockTarget = {
				username: 'Sadie',
				userslug: 'sadie',
				hasProperty: () => false,
				isAlive: true
			};

			playerController = new PlayerController(null);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};
		});

		describe('Votes to lynch', () => {
			it('should return 2 for 2 players', () => {
				mockGame.livePlayers = ['Lars', 'Sadie'];
				sandbox.stub(mockUser, 'hasProperty').returns(false);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(2);
			});

			it('should return 2 for 3 players', () => {
				mockGame.livePlayers = ['Lars', 'Sadie', 'Steven'];
				sandbox.stub(mockUser, 'hasProperty').returns(false);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(2);
			});

			it('should return 3 for 4 players', () => {
				mockGame.livePlayers = ['Lars', 'Sadie', 'Steven', 'Pearl'];
				sandbox.stub(mockUser, 'hasProperty').returns(false);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(3);
			});

			it('should return 4 for 4 players + loved', () => {
				mockGame.livePlayers = ['Lars', 'Sadie', 'Steven', 'Pearl'];
				sandbox.stub(mockUser, 'hasProperty', (prop) => prop === 'loved');
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(4);
			});

			it('should return 2 for 4 players + hated', () => {
				mockGame.livePlayers = ['Lars', 'Sadie', 'Steven', 'Pearl'];
				sandbox.stub(mockUser, 'hasProperty', (prop) => prop === 'hated');
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(2);
			});
		});

		describe('Lynch player', () => {
			beforeEach(() => {
				sandbox.stub(view, 'respondInThread');
				playerController.forum = {
					emit: () => 1
				};
			});

			it('Should lynch successfully', () => {
				sandbox.stub(mockGame, 'killPlayer').resolves();
				sandbox.stub(mockGame, 'nextPhase').resolves();

				return playerController.lynchPlayer(mockGame, mockUser).then(() => {
					mockGame.killPlayer.calledWith(mockUser).should.equal(true);
					mockGame.nextPhase.called.should.equal(true);
					view.respondInThread.calledWith(12).should.equal(true);
					view.respondInThread.firstCall.args[1].should.equal('@Lars has been lynched! Stay tuned for the flip. <b>It is now Night.</b>');
				});
			});
			
			it('Should emit a lynch event', () => {
				sandbox.stub(mockGame, 'killPlayer').resolves();
				sandbox.stub(mockGame, 'nextPhase').resolves();
				sandbox.stub(playerController.forum, 'emit');

				return playerController.lynchPlayer(mockGame, mockUser).then(() => {
					playerController.forum.emit.should.have.been.calledWith('mafia:playerLynched');
				});
			});

			it('Should report errors', () => {
				sandbox.stub(mockGame, 'killPlayer').rejects('Terminator found');
				sandbox.stub(mockGame, 'nextPhase').resolves();

				return playerController.lynchPlayer(mockGame, mockUser).then(() => {
					view.respondInThread.calledWith(12).should.equal(true);
					const output = view.respondInThread.getCall(0).args[1];
					output.should.include('Error when lynching player:');
				});
			});
		});

		describe('Autolynch', () => {
			const voteForSadie = {
				isCurrent: true
			};
			const voteForLars = {
				isCurrent: true
			};

			beforeEach(() => {
				sandbox.stub(playerController, 'lynchPlayer').resolves();

				voteForSadie.target = mockTarget;

				voteForLars.target = mockUser;

			});

			it('should auto-lynch at the threshold', () => {
				sandbox.stub(playerController, 'getNumVotesRequired').returns(2);
				sandbox.stub(mockGame, 'getActions').returns([voteForSadie, voteForSadie]);

				return playerController.checkForAutoLynch(mockGame, mockTarget).then(() => {
					playerController.lynchPlayer.called.should.equal(true);
				});
			});

			it('should not lynch under threshold-1', () => {
				sandbox.stub(playerController, 'getNumVotesRequired').returns(2);
				sandbox.stub(mockGame, 'getActions').returns([voteForSadie]);

				return playerController.checkForAutoLynch(mockGame, mockTarget).then(() => {
					playerController.lynchPlayer.called.should.equal(false);
				});
			});

			it('should only count votes for the target', () => {
				sandbox.stub(playerController, 'getNumVotesRequired').returns(2);
				sandbox.stub(mockGame, 'getActions').returns([voteForLars, voteForLars]);

				return playerController.checkForAutoLynch(mockGame, mockTarget).then(() => {
					playerController.lynchPlayer.called.should.equal(false);
				});
			});

			it('should handle votes with no-lynches thrown in', () => {
				const voteNoLynch = {
					target: null,
					isCurrent: true
				};
				sandbox.stub(playerController, 'getNumVotesRequired').returns(2);
				sandbox.stub(mockGame, 'getActions').returns([voteForLars, voteForLars, voteNoLynch]);

				return playerController.checkForAutoLynch(mockGame, mockTarget).should.resolve;
			});
			it('should not lynch lynchproof', () => {
				sandbox.stub(playerController, 'getNumVotesRequired').returns(1);
				sandbox.stub(mockGame, 'getActions').returns([voteForSadie]);
				mockTarget.hasProperty = (prop) => prop === 'lynchproof';

				return playerController.checkForAutoLynch(mockGame, mockTarget).then(() => {
					playerController.lynchPlayer.called.should.equal(false);
				});
			});
		});
	});

	describe('Voting functions', () => {
		let mockGame, mockVoter, mockTarget, mockdao, playerController;

		describe('For', () => {
			beforeEach(() => {
				mockVoter = {
					username: 'Lars',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockTarget = {
					username: 'Sadie',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockGame = {
					getAllPlayers: () => 1,
					killPlayer: () => 1,
					nextPhase: () => 1,
					registerAction: () => Promise.resolve('Ok'),
					getPlayer: (player) => {
						if (player === 'Lars') {
							return mockVoter;
						}

						if (player === 'Sadie') {
							return mockTarget;
						}
						throw new Error('No such player: ' + player);
					},
					topicId: 12,
					isActive: true,
					isDay: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame)
				};

				playerController = new PlayerController(mockdao, null);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};

				sandbox.spy(view, 'respondInThread');
				sandbox.spy(view, 'respond');
				sandbox.spy(view, 'reportError');

			});

			it('Should require 1 arg', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: [],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: 123
						}
					}
				};
				sandbox.stub(playerController, 'doVote').resolves();
				return playerController.forHandler(command).then((value) => {
					playerController.doVote.called.should.be.false;
					view.reportError.called.should.be.true;
				});
			});

			it('Should not work in chats', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: -1,
							chat: 12
						}
					}
				};

				const resolution = 'Some resolution value';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				return playerController.forHandler(command).then((value) => {
					playerController.doVote.called.should.be.false;
					view.reportError.called.should.be.true;
				});
			});

			it('Should call DoVote()', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				const resolution = 'Some resolution value';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				return playerController.forHandler(command).then((value) => {
					value.should.equal(resolution);

					playerController.doVote.called.should.be.true;
					const args = playerController.doVote.firstCall.args;

					args[0].should.equal(200); //Game ID
					args[1].should.equal(5); //Post ID
					args[2].should.equal('Lars'); //Voter
					args[3].should.equal('Sadie'); //Target string
					args[4].should.equal('!for Sadie'); //Input
					args[5].should.equal(1); //Vote number
					args[6].should.deep.equal(command); //Command
				});
			});
		});

		describe('Vote', () => {
			beforeEach(() => {
				mockVoter = {
					username: 'Lars',
					hasProperty: () => false,
					isAlive: true
				};

				mockTarget = {
					username: 'Sadie',
					hasProperty: () => false,
					isAlive: true
				};

				mockGame = {
					getAllPlayers: () => 1,
					killPlayer: () => 1,
					nextPhase: () => 1,
					registerAction: () => Promise.resolve('Ok'),
					getPlayer: (player) => {
						if (player === 'Lars') {
							return mockVoter;
						}

						if (player === 'Sadie') {
							return mockTarget;
						}
						throw new Error('No such player: ' + player);
					},
					topicId: 12,
					isActive: true,
					isDay: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame),
					getGameByChatId: () => Promise.resolve(mockGame)
				};

				playerController = new PlayerController(mockdao, null);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};

				sandbox.spy(view, 'respondInThread');
				sandbox.spy(view, 'respond');
				sandbox.spy(view, 'reportError');

			});

			it('Should require 1 arg', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: [],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: 123
						}
					}
				};
				sandbox.stub(playerController, 'doVote').resolves();
				return playerController.voteHandler(command).then((value) => {
					playerController.doVote.called.should.be.false;
					view.reportError.called.should.be.true;
				});
			});

			it('Should not work in chats', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: -1,
							chat: 12
						}
					}
				};

				const resolution = 'Some resolution value';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				return playerController.voteHandler(command).then((value) => {
					playerController.doVote.called.should.be.false;
					view.reportError.called.should.be.true;
				});
			});

			it('Should call DoVote()', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					reply: () => Promise.resolve(),
					args: ['Sadie'],
					line: '!for Sadie',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				const resolution = 'Some resolution value';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				sandbox.spy(command, 'reply');
				return playerController.voteHandler(command).then((value) => {
					value.should.equal(resolution);

					playerController.doVote.called.should.be.true;
					const args = playerController.doVote.firstCall.args;

					args[0].should.equal(200); //Game ID
					args[1].should.equal(5); //Post ID
					args[2].should.equal('Lars'); //Voter
					args[3].should.equal('Sadie'); //Target string
					args[4].should.equal('!for Sadie'); //Input
					args[5].should.equal(1); //Vote number
					args[6].should.deep.equal(command); //Command
				});
			});

			it('Should allow "vote for" syntax', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					reply: () => Promise.resolve(),
					args: ['for', 'Sadie'],
					line: '!vote for Sadie',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				const resolution = 'Some resolution value';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				sandbox.spy(command, 'reply');
				return playerController.voteHandler(command).then((value) => {
					value.should.equal(resolution);

					playerController.doVote.called.should.be.true;
					const args = playerController.doVote.firstCall.args;

					args[0].should.equal(200); //Game ID
					args[1].should.equal(5); //Post ID
					args[2].should.equal('Lars'); //Voter
					args[3].should.equal('Sadie'); //Target string
					args[4].should.equal('!vote for Sadie'); //Input
					args[5].should.equal(1); //Vote number
					args[6].should.deep.equal(command); //Command
				});
			});

			it('Should enable doublevotes', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 200
					}),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				const resolution = 'Some resolution value';
				mockVoter.hasProperty = (prop) => prop === 'doublevoter';

				sandbox.stub(playerController, 'doVote').resolves(resolution);
				return playerController.voteHandler(command).then((value) => {
					value.should.equal(resolution);
					playerController.doVote.called.should.be.true;
					const args = playerController.doVote.firstCall.args;

					args[0].should.equal(200); //Game ID
					args[1].should.equal(5); //Post ID
					args[2].should.equal('Lars'); //Voter
					args[3].should.equal('Sadie'); //Target string
					args[4].should.equal('!for Sadie'); //Input
					args[5].should.equal(2); //Vote number
					args[6].should.deep.equal(command); //Command
				});
			});
		});

		describe('doVote()', () => {
			let command;
			beforeEach(() => {

				mockVoter = {
					username: 'Lars',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockTarget = {
					username: 'Sadie',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockGame = {
					getAllPlayers: () => 1,
					killPlayer: () => 1,
					nextPhase: () => 1,
					registerAction: () => Promise.resolve('Ok'),
					getPlayer: (player) => {
						if (player === 'Lars') {
							return mockVoter;
						}

						if (player === 'Sadie') {
							return mockTarget;
						}
						throw new Error('No such player: ' + player);
					},
					topicId: 12,
					isActive: true,
					isDay: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame)
				};

				command = {
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({
						id: 200
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				playerController = new PlayerController(mockdao, null);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};

				sandbox.spy(view, 'respondInThread');
				sandbox.spy(view, 'respond');
				sandbox.spy(view, 'reportError');
			});


			it('should remain silent when no game is in session', () => {
				sandbox.stub(mockdao, 'getGameByTopicId').rejects('No such game');

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					command.reply.called.should.be.false;
				});
			});

			it('should reject votes from non-players', () => {
				mockGame.getPlayer = () => 1;
				sandbox.stub(mockGame, 'getPlayer').throws('No such player');

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('You are not yet a player');
				});
			});

			it('should reject votes for non-players', () => {
				sandbox.stub(mockGame, 'getPlayer').withArgs('Sadie').throws('No such player');

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('your princess is in another castle');
				});
			});

			it('should reject votes for the dead', () => {
				mockTarget.isAlive = false;

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('You would be wise to not speak ill of the dead.');
				});
			});

			it('should reject votes from the dead', () => {
				mockVoter.isAlive = false;

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('Aaagh! Ghosts!');
				});
			});

			it('should reject votes at night', () => {
				mockGame.isDay = false;

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('It is not day');
				});
			});

			it('should announce voting failures', () => {
				//TODO
				sandbox.stub(mockGame, 'registerAction').rejects('Unknown failure');

				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.reportError.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include(':wtf:');
				});
			});

			it('should register your vote', () => {
				sandbox.spy(mockGame, 'registerAction');
				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					//Args: (postId, actor, target, type, actionToken)
					const expectedArgs = [43, 'Lars', 'Sadie', 'vote', 'vote'];
					mockGame.registerAction.called.should.equal(true);
					mockGame.registerAction.getCall(0).args.should.deep.equal(expectedArgs);
				});
			});

			it('should register second vote', () => {
				sandbox.spy(mockGame, 'registerAction');
				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 2, command).then(() => {
					//Args: (postId, actor, target, type, actionToken)
					const expectedArgs = [43, 'Lars', 'Sadie', 'vote', 'doubleVote'];
					mockGame.registerAction.called.should.equal(true);
					mockGame.registerAction.getCall(0).args.should.deep.equal(expectedArgs);
				});
			});

			it('should echo your vote when successful', () => {
				return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1, command).then(() => {
					view.respond.called.should.be.true;

					const output = command.reply.firstCall.args[0];
					output.should.include('@Lars voted for @Sadie');
				});
			});
		});

		describe('unvote()', () => {
			beforeEach(() => {

				mockVoter = {
					username: 'tehNinja',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockGame = {
					getAllPlayers: () => 1,
					killPlayer: () => 1,
					nextPhase: () => 1,
					registerAction: () => Promise.resolve('Ok'),
					revokeAction: () => Promise.resolve('Ok'),
					getPlayer: () => mockVoter,
					topicId: 12,
					isActive: true,
					isDay: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame),
					getGameByChatId: () => Promise.resolve(mockGame)
				};

				playerController = new PlayerController(mockdao, null);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};
				sandbox.stub(view, 'respondInThread');
				sandbox.stub(view, 'respond');
				sandbox.stub(view, 'reportError');
			});

			it('should remain silent when no game is in session', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: ['@noLunch'],
					input: '!for @noLunch',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockdao, 'getGameByTopicId').rejects();

				return playerController.unvoteHandler(command).then(() => {
					view.respondInThread.called.should.be.false;
				});
			});

			it('should reject unvotes from non-players', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockGame, 'getPlayer').throws('No such player');
				return playerController.unvoteHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('You are not yet a player.');
				});
			});

			it('should reject unvotes from the dead', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockVoter.isAlive = false;
				return playerController.unvoteHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('You are no longer among the living.');
				});
			});

			it('should reject unvotes at night', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.isDay = false;
				return playerController.unvoteHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('It is not day');
				});
			});

			it('Should not work in chats', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: -1,
							chat: 12
						}
					}
				};

				sandbox.spy(mockGame, 'revokeAction');
				return playerController.unvoteHandler(command).then((value) => {
					mockGame.revokeAction.called.should.be.false;
				});
			});

			it('should rescind your vote', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 98765
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.spy(mockGame, 'revokeAction');
				return playerController.unvoteHandler(command).then(() => {
					mockGame.revokeAction.calledTwice.should.be.true;

					//Args: (postId, actor, target, type, actionToken)
					let expectedArgs = [98765, 'tehNinja', undefined, 'vote', 'vote'];
					mockGame.revokeAction.firstCall.args.should.deep.equal(expectedArgs);

					//Doublevote handler
					expectedArgs = [98765, 'tehNinja', undefined, 'vote', 'doubleVote'];
					mockGame.revokeAction.secondCall.args.should.deep.equal(expectedArgs);

					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('@tehNinja unvoted in post ');
				});
			});
		});

		describe('noLynch()', () => {

			beforeEach(() => {

				mockVoter = {
					username: 'tehNinja',
					getPlayerProperty: () => 1,
					isAlive: true
				};

				mockGame = {
					getAllPlayers: () => 1,
					killPlayer: () => 1,
					nextPhase: () => 1,
					registerAction: () => Promise.resolve('Ok'),
					revokeAction: () => Promise.resolve('Ok'),
					getPlayer: () => mockVoter,
					topicId: 12,
					isActive: true,
					isDay: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame),
					getGameByChatId: () => Promise.resolve(mockGame)
				};

				playerController = new PlayerController(mockdao, null);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};
				sandbox.stub(view, 'respondInThread');
				sandbox.stub(view, 'respond');
			});


			it('should remain silent when no game is in session', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: ['@noLunch'],
					input: '!for @noLunch',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockdao, 'getGameByTopicId').rejects();

				return playerController.nolynchHandler(command).then(() => {
					view.respond.called.should.be.false;
				});
			});

			it('should reject votes from non-players', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockGame, 'getPlayer').throws('No such player');
				return playerController.nolynchHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('You are not yet a player.');
				});
			});

			it('should reject votes from the dead', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockVoter.isAlive = false;
				return playerController.nolynchHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('You are no longer among the living.');
				});
			});

			it('should reject votes at night', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 2
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.isDay = false;
				return playerController.nolynchHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('It is not day');
				});
			});

			it('Should not work in chats', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve(mockVoter),
					getPost: () => Promise.resolve({
						id: 5
					}),
					args: ['Sadie'],
					line: '!for Sadie',
					reply: () => Promise.resolve(),
					parent: {
						ids: {
							topic: -1,
							chat: 12
						}
					}
				};

				sandbox.spy(mockGame, 'registerAction');
				return playerController.nolynchHandler(command).then((value) => {
					mockGame.registerAction.called.should.be.false;
				});
			});

			it('should register a vote to no-lynch', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getPost: () => Promise.resolve({
						id: 98765
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					input: '!unvote',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.spy(mockGame, 'registerAction');
				return playerController.nolynchHandler(command).then(() => {
					const output = view.respond.getCall(0).args[1];
					output.should.include('@tehNinja voted to not lynch in post ');

					//Args: (postId, actor, target, type, actionToken)
					const expectedArgs = [98765, 'tehNinja', undefined, 'vote'];
					mockGame.registerAction.getCall(0).args.should.deep.equal(expectedArgs);

					view.respond.called.should.be.true;
				});
			});
		});
	});

	describe('join()', () => {

		let mockGame, mockUser, mockdao, playerController;
		beforeEach(() => {

			mockUser = {
				username: 'tehNinja',
				getPlayerProperty: () => 1,
				isAlive: true
			};

			mockGame = {
				allPlayers: [],
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				revokeAction: () => Promise.resolve('Ok'),
				getPlayer: () => 1,
				addPlayer: () => Promise.resolve(),
				topicId: 12,
				isActive: false,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			playerController = new PlayerController(mockdao, null);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');
		});


		it('should remain silent when no game is in session', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				input: '!join',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.stub(mockdao, 'getGameByTopicId').rejects();

			return playerController.joinHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;

			});
		});

		it('should not allow duplicates', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			mockGame.allPlayers = [mockUser];
			sandbox.spy(mockGame, 'addPlayer');

			return playerController.joinHandler(command).then(() => {
				mockGame.addPlayer.called.should.be.false;
				view.reportError.called.should.be.true;

				const output = view.reportError.getCall(0).args[2].toString();
				output.should.include('You are already in this game, @tehNinja!');
			});
		});

		it('should report errors', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.stub(mockGame, 'addPlayer').rejects('Error!');

			return playerController.joinHandler(command).then(() => {
				view.reportError.called.should.be.true;

				const preface = view.reportError.getCall(0).args[1];
				preface.should.include('Error when adding to game:');
			});

		});

		it('should not allow joining a game already in progress', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				parent: {
					ids: {
						topic: 123
					}
				}
			};
			mockGame.isActive = true;
			sandbox.spy(mockGame, 'addPlayer');

			return playerController.joinHandler(command).then(() => {
				mockGame.addPlayer.called.should.be.false;
				view.reportError.called.should.be.true;

				const output = view.reportError.getCall(0).args[2].toString();
				output.should.include('Cannot join game in progress.');
			});
		});

		it('should facilitate joining', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			return playerController.joinHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('Welcome to the game, @tehNinja');
			});
		});

		it('should facilitate joining in chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [''],
				parent: {
					ids: {
						topic: -1,
						chat: 12
					}
				}
			};

			return playerController.joinHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('Welcome to the game, @tehNinja');
			});
		});
	});

	describe('list players', () => {

		let mockGame, mockdao, playerController, mockUsers;

		beforeEach(() => {
			mockUsers = {
				yami: {
					username: 'Yamikuronue',
					getPlayerProperty: () => 1,
					isAlive: true,
					isModerator: false
				},

				accalia: {
					username: 'Accalia',
					getPlayerProperty: () => 1,
					isAlive: false,
					isModerator: false
				},

				dreikin: {
					username: 'Dreikin',
					getPlayerProperty: () => 1,
					isAlive: false,
					isModerator: true
				}
			};

			mockGame = {
				allPlayers: mockUsers,
				livePlayers: [mockUsers.yami],
				deadPlayers: [mockUsers.accalia],
				moderators: [mockUsers.dreikin],
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				revokeAction: () => Promise.resolve('Ok'),
				getPlayer: () => 1,
				addPlayer: () => Promise.resolve(),
				topicId: 12,
				isActive: true,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			playerController = new PlayerController(mockdao, null);
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');
		});

		describe('list-all-players()', () => {

			it('should remain silent when no game is in session', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					args: ['@noLunch'],
					input: '!for @noLunch',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.isActive = false;

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respondInThread.called.should.be.false;
					view.reportError.called.should.be.false;
				});
			});

			it('should report players', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					args: [''],
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('Yamikuronue');
					output.should.include('Accalia');
					output.should.include('Dreikin');
				});
			});

			it('should report players in a chat', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					parent: {
						ids: {
							topic: -1,
							chat: 123
						}
					}
				};

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('Yamikuronue');
					output.should.include('Accalia');
					output.should.include('Dreikin');
				});
			});

			it('should report when no living players exist', () => {
				//TODO: Probably a 'game over' message?
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.livePlayers = [];

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('### Living:\nNobody! Aren\'t you special?\n');
				});
			});

			it('should report when no dead players exist', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.deadPlayers = [];

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('### Dead:\nNobody! Aren\'t you special?\n');
				});
			});

			it('should report when there are no mods', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [''],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.moderators = [];

				return playerController.listAllPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('### Mod(s):\nNone. Weird.');
				});
			});
		});

		describe('list-players()', () => {
			it('should remain silent when no game is in session', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: ['@noLunch'],
					input: '!for @noLunch',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.isActive = false;

				return playerController.listPlayersHandler(command).then(() => {
					view.respondInThread.called.should.be.false;
					view.reportError.called.should.be.false;

				});
			});

			it('should report only living players and mods', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				return playerController.listPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('Yamikuronue');
					output.should.not.include('Accalia');
					output.should.include('Dreikin');
				});
			});

			it('should work in chat', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: -1,
							chat: 123
						}
					}
				};

				return playerController.listPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('Yamikuronue');
					output.should.not.include('Accalia');
					output.should.include('Dreikin');
				});
			});

			it('should report lack of living players', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					args: [],
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.livePlayers = [];
				mockGame.moderators = [];

				return playerController.listPlayersHandler(command).then(() => {
					view.respond.called.should.be.true;

					const output = view.respond.getCall(0).args[1];
					output.should.include('Nobody! Aren\'t you special?\n');
					output.should.not.include('Accalia');
					output.should.not.include('Yamikuronue');
					output.should.include('None. Weird.');
				});
			});
		});
	});

	describe('Voting record', () => {
		let mockGame, mockdao, playerController, mockUsers, mockActions;

		beforeEach(() => {
			mockUsers = {
				yamikuronue: {
					username: 'Yamikuronue',
					hasProperty: () => false,
					isAlive: true,
					isModerator: false
				},

				accalia: {
					username: 'Accalia',
					hasProperty: () => false,
					isAlive: true,
					isModerator: false
				},

				ninja: {
					username: 'TehNinja',
					hasProperty: () => false,
					isAlive: true,
					isModerator: false
				},

				dreikin: {
					username: 'Dreikin',
					hasProperty: () => false,
					isAlive: true,
					isModerator: false
				}
			};

			mockActions = [{
				postId: 1,
				actor: mockUsers.accalia,
				target: mockUsers.yamikuronue,
				action: 'vote',
				revokedId: 2,
				isCurrent: false
			}, {
				postId: 3,
				actor: mockUsers.accalia,
				target: mockUsers.dreikin,
				action: 'vote',
				revokedId: undefined,
				isCurrent: true
			}, {
				postId: 4,
				actor: mockUsers.yamikuronue,
				target: mockUsers.dreikin,
				action: 'vote',
				revokedId: undefined,
				isCurrent: true
			}, {
				postId: 5,
				actor: mockUsers.dreikin,
				target: mockUsers.yamikuronue,
				action: 'boogie',
				revokedId: undefined,
				isCurrent: true
			}];

			mockGame = {
				allPlayers: [mockUsers.yamikuronue, mockUsers.dreikin, mockUsers.accalia, mockUsers.ninja],
				livePlayers: [mockUsers.yamikuronue, mockUsers.dreikin, mockUsers.accalia, mockUsers.ninja],
				deadPlayers: [],
				moderators: [],
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				revokeAction: () => Promise.resolve('Ok'),
				getPlayer: (player) => {
					return mockUsers[player.toLowerCase()];
				},
				addPlayer: () => Promise.resolve(),
				getActions: () => mockActions,
				getValue: () => undefined,
				topicId: 12,
				isActive: true,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			playerController = new PlayerController(mockdao, null);
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'respondWithTemplate');
			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');
		});

		describe('list-votes()', () => {


			it('should remain silent when no game is in session', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: ['@noLunch'],
					input: '!for @noLunch',
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				mockGame.isActive = false;

				return playerController.listVotesHandler(command).then(() => {
					view.respondInThread.called.should.be.false;
					view.reportError.called.should.be.false;
				});
			});

			it('should extract who is not voting', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					dataSent.numPlayers.should.equal(4);
					dataSent.notVoting.should.include('Dreikin');
					dataSent.notVoting.should.include('TehNinja');
					dataSent.notVoting.should.not.include('Yamikuronue');
					dataSent.numNotVoting.should.equal(2);
				});
			});

			it('should output votes and only votes', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					dataSent.votes.Yamikuronue.votes.should.include(mockActions[0]);
					dataSent.votes.Yamikuronue.votes.should.not.include(mockActions[3]);
					dataSent.votes.Dreikin.votes.should.include(mockActions[1]);
					dataSent.votes.Dreikin.votes.should.include(mockActions[2]);
				});
			});

			it('should work in chat', () => {
				const command = {
					getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: -1,
							chat: 123
						}
					}
				};

				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
				});
			});

			it('should report accurate to-lynch count', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.spy(Utils, 'getNumVotesRequired');
				return playerController.listVotesHandler(command).then(() => {
					Utils.getNumVotesRequired.called.should.be.true;
				});
			});

			it('should output mod of 0 for vanilla', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					args: [],
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];
					dataSent.votes.Dreikin.mod.should.equal(0);
				});
			});

			it('should output mod of +1 for loved', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockUsers.dreikin, 'hasProperty', (prop) => prop === 'loved');
				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					dataSent.votes.Dreikin.mod.should.equal(1);
				});
			});

			it('should output mod of -1 for hated', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockUsers.dreikin, 'hasProperty', (prop) => prop === 'hated');
				return playerController.listVotesHandler(command).then(() => {
					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					dataSent.votes.Dreikin.mod.should.equal(-1);
				});
			});

			it('should output lack of end time', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					args: [],
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.spy(mockGame, 'getValue');
				return playerController.listVotesHandler(command).then(() => {
					mockGame.getValue.calledWith('phaseEnd').should.be.true;

					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					chai.expect(dataSent.endTime).to.be.undefined;
					dataSent.showEndTime.should.be.false;
				});
			});

			it('should output an end time', () => {
				const command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'tehNinja'
					}),
					args: [],
					parent: {
						ids: {
							topic: 123
						}
					}
				};

				sandbox.stub(mockGame, 'getValue').returns('today');
				return playerController.listVotesHandler(command).then(() => {
					mockGame.getValue.calledWith('phaseEnd').should.be.true;

					view.respondWithTemplate.called.should.be.true;
					const dataSent = view.respondWithTemplate.getCall(0).args[1];

					chai.expect(dataSent.endTime).to.equal('today');
					dataSent.showEndTime.should.be.true;
				});
			});
		});
	});

	describe('target()', () => {

		let mockGame, mockUser, mockTarget, mockdao, playerController;
		beforeEach(() => {

			mockUser = {
				username: 'tehNinja',
				getProperties: () => [],
				hasProperty: () => false,
				isAlive: true
			};

			mockTarget = {
				username: 'noLunch',
				getProperties: () => [],
				hasProperty: () => false,
				isAlive: true
			};

			mockGame = {
				allPlayers: [],
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				revokeAction: () => Promise.resolve('Ok'),
				getPlayer: () => 1,
				addPlayer: () => 1,
				topicId: 12,
				isActive: false,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame),
				getGameByName: () => Promise.resolve(mockGame)
			};

			playerController = new PlayerController(mockdao, null);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};
			sandbox.stub(view, 'respondInThread').resolves();
			sandbox.stub(view, 'respond').resolves();
			sandbox.stub(view, 'reportError').resolves();
			sandbox.stub(view, 'respondWithTemplate').resolves();
		});

		it('Should require 1 arg', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.called.should.be.false;
				view.reportError.called.should.be.true;
			});
		});

		it('Should register actions', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'target').should.equal.true;
			});
		});

		it('Should register actions from chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: -1,
						chat: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'target').should.equal.true;
			});
		});

		it('Should search for the game by ID', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(playerController, 'getGame');

			return playerController.targetHandler(command).then(() => {
				playerController.getGame.called.should.be.true;
			});
		});

		it('Should register scum actions', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			sandbox.spy(mockGame, 'revokeAction');
			sandbox.stub(mockUser, 'hasProperty').returns(false).withArgs('scum').returns(true);
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'scum').should.equal.true;
				mockGame.revokeAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'scum').should.equal.true;
			});
		});

		it('Should register secondary scum actions', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			sandbox.spy(mockGame, 'revokeAction');
			sandbox.stub(mockUser, 'hasProperty').returns(false).withArgs('scum2').returns(true);
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'scum2').should.equal.true;
				mockGame.revokeAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'scum2').should.equal.true;
			});
		});

		it('Should not respond when there is no game found', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getPost: () => Promise.resolve({
					id: 42
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['@noLunch'],
				input: '!target @noLunch',
				parent: {
					ids: {
						topic: 123
					}
				}
			};

			sandbox.spy(mockGame, 'registerAction');
			return playerController.targetHandler(command).then(() => {
				mockGame.registerAction.calledWith(42, 'tehNinja', 'noLunch', 'target', 'target').should.equal.false;
			});
		});
	});

	describe('createChatHandler()', () => {

		let controller = null,
			dao = null,
			game = null,
			command = null,
			chatroom = null;
		beforeEach(() => {
			chatroom = {
				id: Math.random(),
				send: sinon.stub().resolves()
			};
			command = {
				args: ['userfoo', 'in', 'testMafia'],
				getUser: sinon.stub().resolves({}),
				reply: sinon.stub().resolves(),
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				parent: {
					ids: {}
				}
			};
			game = {
				name: 'testMafia',
				moderators: [],
				addChat: sinon.stub().resolves(),
				getPlayer: sinon.stub().returns({}),
				getValue: sinon.stub(),
				chatRecord: null,
				topicId:  8675309,
				setValue: (key, value) => {
					if (key === 'postman_chats') {
						game.chatRecord = value;
					}
				}
			};
			
			game.getValue.withArgs('chats').returns('true');
			game.getValue.withArgs('postman').returns('off');
			
			dao = {
				getGame: sinon.stub().resolves(game),
				getGameByTopicId: sinon.stub().resolves(game),
				getGameByName: sinon.stub().resolves(game)
			};
			controller = new PlayerController(dao);
			controller.forum = {
				Chat: {
					create: sinon.stub().resolves(chatroom)
				}
			};
		});
		describe('errors', () => {
			it('should reply with usage when no args provided', () => {
				command.args = [];
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.called.once;
					const args = command.reply.firstCall.args;
					args[0].should.equal('Invalid command: Usage `!chat with somePlayer`');
				});
			});
			it('should reply with usage when username not provided', () => {
				command.args = ['to'];
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith('Invalid command: Usage `!chat with somePlayer`').once;
				});
			});
			it('should reply with error when getGame rejects', () => {
				const error = new Error(`whoopsies ${Math.random()}`),
					errormsg = `Error creating chat: ${error}`;
					
				sandbox.stub(controller, 'getGame').rejects(error);
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply with error when getUser() rejects', () => {
				const error = new Error(`whoopsies ${Math.random()}`),
					errormsg = `Error creating chat: ${error}`;
				command.getUser.rejects(error);
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply with error when chats disabled', () => {
				const errormsg = 'Error creating chat: Error: Chats are not enabled for this game';
				game.getValue.withArgs('chats').returns('false');
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply when requester not player', () => {
				const errormsg = 'Error creating chat: Error: You are not a living player in this game';
				game.getPlayer.onFirstCall().throws(new Error);
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply when target not player', () => {
				const errormsg = 'Error creating chat: Error: \'userfoo\' is not a living player in this game';
				game.getPlayer.onSecondCall().throws(new Error);
				return controller.createChatHandler(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
		});
		it('should create chatroom on success', () => {
			return controller.createChatHandler(command).then(() => {
				controller.forum.Chat.create.should.be.called.once;
			});
		});
		it('should include mods in user list', () => {
			const mod1 = `mod${Math.random()}`,
				mod2 = `mod${Math.random()}`;
			game.moderators = [{
				username: mod1
			}, {
				username: mod2
			}];
			return controller.createChatHandler(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[0].should.include(mod1);
				args[0].should.include(mod2);
			});
		});
		it('should include sender in user list', () => {
			const target = `user${Math.random()}`;
			game.getPlayer.onFirstCall().returns({
				username: target
			});
			return controller.createChatHandler(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[0].should.include(target);
			});
		});
		it('should include target in user list', () => {
			const target = `user${Math.random()}`;
			game.getPlayer.onSecondCall().returns({
				username: target
			});
			return controller.createChatHandler(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[0].should.include(target);
			});
		});
		it('should send expected message', () => {
			game.name = `NAME ${Math.random()} NAME`;
			const expected = `This is an officially sanctioned chat for ${game.name}`;
			return controller.createChatHandler(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[1].should.equal(expected);
			});
		});
		it('should send expected title', () => {
			game.name = `NAME ${Math.random()} NAME`;
			const expected = `Sanctioned chat for ${game.name}`;
			return controller.createChatHandler(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[2].should.equal(expected);
			});
		});
		it('should add chatroom to game', () => {
			const id = Math.random();
			controller.forum.Chat.create.resolves({
				id: id
			});
			return controller.createChatHandler(command).then(() => {
				game.addChat.should.be.calledWith(id).once;
			});
		});
		it('should confirm that chat was sent', () => {
			game.name = `NAME ${Math.random()} NAME`;

			const username = `user${Math.random()}`,
				target = `target${Math.random()}`,
				expected = `Started chat between ${username} and ${target} in ${game.name}`;
			command.getUser.resolves({
				username: username
			});
			command.args = [target, 'in', 'testMafia'];
			return controller.createChatHandler(command).then(() => {
				command.reply.should.be.calledWith(expected).once;
			});
		});
		it('should allow optional leading `with` parameter', () => {
			game.name = `NAME ${Math.random()} NAME`;

			const username = `user${Math.random()}`,
				target = `target${Math.random()}`,
				expected = `Started chat between ${username} and ${target} in ${game.name}`;
			command.getUser.resolves({
				username: username
			});
			command.args = ['with', target, 'in', 'testMafia'];
			return controller.createChatHandler(command).then(() => {
				command.reply.should.be.calledWith(expected).once;
			});
		});
		it('should allow optional leading `to` parameter', () => {
			game.name = `NAME ${Math.random()} NAME`;

			const username = `user${Math.random()}`,
				target = `target${Math.random()}`,
				expected = `Started chat between ${username} and ${target} in ${game.name}`;
			command.getUser.resolves({
				username: username
			});
			command.args = ['to', target, 'in', 'testMafia'];
			return controller.createChatHandler(command).then(() => {
				command.reply.should.be.calledWith(expected).once;
			});
		});
		
		describe('Postman mode', () => {

			it('should not include sender in user list', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				game.getValue.withArgs('postman').returns('on');
				
				return controller.createChatHandler(command).then(() => {
					controller.forum.Chat.create.should.be.called;
					const args = controller.forum.Chat.create.firstCall.args;
					args[0].should.not.include('accalia');
				});
			});
			
			it('should send the message', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				game.getValue.withArgs('postman').returns('on');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = 'Someone said: hi how are you';
				
				return controller.createChatHandler(command).then(() => {
					controller.forum.Chat.create.should.be.called;
					chatroom.send.should.be.called;
					const args = chatroom.send.firstCall.args;
					args[0].should.equal(expected);
				});
			});
			
			it('should re-use chats', () => {
				const target = 'lapisLazuli';
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				game.getValue.withArgs('postman').returns('on');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				game.getValue = (key) => {
					if (key === 'postman_chats') {
						return game.chatRecord;
					} else {
						return 'on';
					}
				};
				
				return controller.createChatHandler(command)
				.then(() => command.args = ['with', target, 'hi', 'how', 'are', 'you'])
				.then(() => controller.createChatHandler(command))
				.then(() => {
					controller.forum.Chat.create.should.be.calledOnce;
				});
			});
			
			it('should respect lack of cc', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent from accalia to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
			
			it('should respect cc value for 1 thread', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns('1234');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent from accalia to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.calledWith('1234');
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect cc value for 2 threads', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns('1234,5678');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent from accalia to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.calledWith('1234');
					view.respondInThread.should.be.calledWith('5678');
					view.respondInThread.firstCall.args[1].should.equal(expected);
					view.respondInThread.secondCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect lack of cc', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
			
			it('should respect lack of public', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns(undefined);
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.calledWith(8675309);
				});
			});
			
			it('should respect public off', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('off');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.calledWith(8675309);
				});
			});
			
			it('should respect public on', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('on');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.called;
					view.respondInThread.firstCall.args[0].should.equal(8675309);
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect public day during the day', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				game.phase = 'day';
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('day');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.called;
					view.respondInThread.firstCall.args[0].should.equal(8675309);
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect public day during the night', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				game.phase = 'night';
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('on');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('day');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
		});
		
		describe('Postman mode open', () => {

			it('should not include sender in user list', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				game.getValue.withArgs('postman').returns('open');
				
				return controller.createChatHandler(command).then(() => {
					controller.forum.Chat.create.should.be.called;
					const args = controller.forum.Chat.create.firstCall.args;
					args[0].should.not.include('accalia');
				});
			});
			
			it('should send the message', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = 'accalia said: hi how are you';
				
				return controller.createChatHandler(command).then(() => {
					controller.forum.Chat.create.should.be.called;
					chatroom.send.should.be.called;
					const args = chatroom.send.firstCall.args;
					args[0].should.equal(expected);
				});
			});
			
			it('should re-use chats', () => {
				const target = 'lapisLazuli';
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				game.getValue = (key) => {
					if (key === 'postman_chats') {
						return game.chatRecord;
					} else if (key === 'postman') {
						return 'open';
					} else {
						return 'true';
					}
				};
				
				return controller.createChatHandler(command)
				.then(() => command.args = ['with', target, 'hi', 'how', 'are', 'you'])
				.then(() => controller.createChatHandler(command))
				.then(() => {
					controller.forum.Chat.create.should.be.calledOnce;
				});
			});
			
			it('should respect cc value for 1 thread', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns('1234');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent from accalia to ${target}: \naccalia said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.calledWith('1234');
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect cc value for 2 threads', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns('1234,5678');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent from accalia to ${target}: \naccalia said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.calledWith('1234');
					view.respondInThread.should.be.calledWith('5678');
					view.respondInThread.firstCall.args[1].should.equal(expected);
					view.respondInThread.secondCall.args[1].should.equal(expected);
				});
			});
			
			it('should cc value for 0 threads', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns('');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
			
			it('should respect lack of cc', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns(undefined);
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
			
			it('should respect lack of public', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-public').returns(undefined);
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.calledWith(8675309);
				});
			});
			
			it('should respect public off', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('off');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.calledWith(8675309);
				});
			});
			
			it('should respect public on', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('on');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \naccalia said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.called;
					view.respondInThread.firstCall.args[0].should.equal(8675309);
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect public day during the day', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				game.phase = 'day';
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('day');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \naccalia said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.be.called;
					view.respondInThread.firstCall.args[0].should.equal(8675309);
					view.respondInThread.firstCall.args[1].should.equal(expected);
				});
			});
			
			it('should respect public day during the night', () => {
				const target = `user${Math.random()}`;
				game.getPlayer.onFirstCall().returns({
					username: 'accalia'
				});
				
				game.phase = 'night';
				
				command.getUser.resolves({username: 'accalia'});
				game.getValue.withArgs('postman').returns('open');
				game.getValue.withArgs('postman-cc').returns(undefined);
				game.getValue.withArgs('postman-public').returns('day');
				command.args = ['with', target, 'hi', 'how', 'are', 'you'];
				const expected = `Message sent to ${target}: \nSomeone said: hi how are you`;
				
				sandbox.stub(view, 'respondInThread').resolves();
				return controller.createChatHandler(command).then(() => {
					view.respondInThread.should.not.be.called;
				});
			});
		});
	});
});
