'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
require('chai-as-promised');

chai.should();

const mafia = require('../../src/player_controller');
const PlayerController = require('../../src/player_controller');
const mafiaDAO = require('../../src/dao/index.js');
const Handlebars = require('handlebars');
const view = require('../../src/view.js');
const validator = require('../../src/validator.js');

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


	describe.only('Vote helpers', () => {
		let mockGame, mockUser, mockTarget, mockdao, playerController;

		beforeEach(() => {
			mockGame = {
				getAllPlayers: () => 1,
				killPlayer: () => 1,
				nextPhase: () => 1,
				getActions: () => 1,
				topicId: 12
			};

			mockUser = {
				username: 'Lars',
				getPlayerProperty: () => [],
				isAlive: true
			};

			mockTarget = {
				username: 'Sadie',
				getPlayerProperty: () => [],
				isAlive: true
			};

			playerController = new PlayerController(null);
		});


		describe('Votes to lynch', () => {
			it('should return 1 for 2 players', () => {
				sandbox.stub(mockGame, 'getAllPlayers').returns(['Lars', 'Sadie']);
				sandbox.stub(mockUser, 'getPlayerProperty').returns([]);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(1);
			});

			it('should return 2 for 3 players', () => {
				sandbox.stub(mockGame, 'getAllPlayers').returns(['Lars', 'Sadie', 'Steven']);
				sandbox.stub(mockUser, 'getPlayerProperty').returns([]);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(2);
			});

			it('should return 2 for 4 players', () => {
				sandbox.stub(mockGame, 'getAllPlayers').returns(['Lars', 'Sadie', 'Steven', 'Pearl']);
				sandbox.stub(mockUser, 'getPlayerProperty').returns([]);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(2);
			});

			it('should return 3 for 4 players + loved', () => {
				sandbox.stub(mockGame, 'getAllPlayers').returns(['Lars', 'Sadie', 'Steven', 'Pearl']);
				sandbox.stub(mockUser, 'getPlayerProperty').returns(['loved']);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(3);
			});

			it('should return 1 for 4 players + hated', () => {
				sandbox.stub(mockGame, 'getAllPlayers').returns(['Lars', 'Sadie', 'Steven', 'Pearl']);
				sandbox.stub(mockUser, 'getPlayerProperty').returns(['hated']);
				playerController.getNumVotesRequired(mockGame, mockUser).should.equal(1);
			});
		});

		describe('Lynch player', () => {
			beforeEach(() => {
				sandbox.stub(view, 'respondInThread');
			});

			it('Should lynch successfully', () => {
				sandbox.stub(mockGame, 'killPlayer').resolves();
				sandbox.stub(mockGame, 'nextPhase').resolves();

				return playerController.lynchPlayer(mockGame, mockUser).then(() => {
					mockGame.killPlayer.calledWith(mockUser).should.equal(true);
					mockGame.nextPhase.called.should.equal(true);
					view.respondInThread.calledWith(12).should.equal(true);
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
			const voteForSadie = {};
			const voteForLars = {};

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
		});
	});

	describe('doVote()', () => {
		let mockGame, mockVoter, mockTarget, mockdao, playerController;
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
					isDaytime: true
				};

				mockdao = {
					getGameByTopicId: () => Promise.resolve(mockGame)
				};

				playerController = new PlayerController(mockdao, null);
				sandbox.stub(view, 'respondInThread');
			});


		it('should remain silent when no game is in session', () => {
			sandbox.stub(mockdao, 'getGameByTopicId').rejects('No such game');

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.false;
			});
		});

		it('should reject votes from non-players', () => {
			mockGame.getPlayer = () => 1;
			sandbox.stub(mockGame, 'getPlayer').throws('No such player');

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('Voter not in game');
			});
		});
		
		it('should reject votes for non-players', () => {
			sandbox.stub(mockGame, 'getPlayer').withArgs('Sadie').throws('No such player');

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('Target not in game');
			});
		});
		
		it('should reject votes for the dead', () => {
			mockTarget.isAlive = false;

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('You would be wise to not speak ill of the dead.');
			});
		});

		it('should reject votes from the dead', () => {
			mockVoter.isAlive = false;

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('Aaagh! Ghosts!');
			});
		});
		
		it('should reject votes at night', () => {
			mockGame.isDaytime = false;

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('It is not day');
			});
		});

		it('should announce voting failures', () => {
			//TODO
			sandbox.stub(mockGame, 'registerAction').rejects('Unknown failure');

			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include(':wtf:');
			});
		});
	
		it('should echo your vote when successful', () => {
			return playerController.doVote(1234, 43, 'Lars', 'Sadie', '!vote Sadie', 1).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('@Lars voted for @Sadie');
			});
		});
	});

	describe('unvote()', () => {

		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.unvoteHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should reject unvotes from non-players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [''],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();

			return mafia.unvoteHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('You are not yet a player.');
			});
		});
		
		it('should reject unvotes from the dead', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(false);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);

			return mafia.unvoteHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('You are no longer among the living.');
			});
		});
		
		it('should reject unvotes at night', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(false);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);

			return mafia.unvoteHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('It is not day');
			});
		});
		
		it('should not revoke nonexistant votes', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.unvoteHandler(command).then(() => {
				mafiaDAO.revokeAction.called.should.be.false;
			});
		});
		
		it('should not revoke nonexistant votes for the wrong player', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['Yamikuronue'],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves([{
				target: {
					name: 'Jack frost'
				}
			}]);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.unvoteHandler(command).then(() => {
				mafiaDAO.revokeAction.called.should.be.false;
			});
		});
		
		it('should rescind your vote', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves([{
				id: 1,
				post: 98556,
				name: 'charlie'
			}]);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.unvoteHandler(command).then(() => {
				mafiaDAO.getCurrentVoteByPlayer.called.should.be.true;
				mafiaDAO.revokeAction.called.should.be.true;
				mafiaDAO.revokeAction.getCall(0).args[0].should.equal(12345);
				mafiaDAO.revokeAction.getCall(0).args[1].should.equal(98556);
				mafiaDAO.revokeAction.getCall(0).args[2].should.equal(98765);
				
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('@tehNinja unvoted in post ');
			});
		});
		
		it('should rescind both votes for a doublevoter', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves([{
				target: {
					name: 'Yamikuronue'
				},
				post: 123
			},
			{
				target: {
					name: 'accalia'
				},
				post: 456
			}]);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.unvoteHandler(command).then(() => {
				mafiaDAO.revokeAction.calledWith(12345, 123, 98765).should.be.true;
				mafiaDAO.revokeAction.calledWith(12345, 456, 98765).should.be.true;
			});
		});
		
		it('should rescind your vote', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves([{
				id: 1,
				post: 98556,
				name: 'charlie'
			}]);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.unvoteHandler(command).then(() => {
				mafiaDAO.getCurrentVoteByPlayer.called.should.be.true;
				mafiaDAO.revokeAction.called.should.be.true;
				mafiaDAO.revokeAction.getCall(0).args[0].should.equal(12345);
				mafiaDAO.revokeAction.getCall(0).args[1].should.equal(98556);
				mafiaDAO.revokeAction.getCall(0).args[2].should.equal(98765);
				
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('@tehNinja unvoted in post ');
			});
		});
	});
	
	describe('noLynch()', () => {
		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.nolynchHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should reject votes from non-players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves();

			return mafia.nolynchHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('You are not yet a player.');
			});
		});
		
		it('should reject votes from the dead', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [''],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(false);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);

			return mafia.nolynchHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('You are no longer among the living.');
			});
		});
		
		it('should reject votes at night', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [''],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(false);
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);

			return mafia.nolynchHandler(command).then(() => {
				view.respond.called.should.be.true;

				const output = view.respond.getCall(0).args[1];
				output.should.include('It is not day');
			});
		});
		
		it('should not revoke nonexistant votes', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [''],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves(undefined);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.nolynchHandler(command).then(() => {
				mafiaDAO.revokeAction.called.should.be.false;
			});
		});
		
		it('should rescind your vote', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves([{
				id: 1,
				name: 'charlie'
			}]);
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.nolynchHandler(command).then(() => {
				mafiaDAO.getCurrentVoteByPlayer.called.should.be.true;
				mafiaDAO.revokeAction.called.should.be.true;
			});
		});
		
		it('should register a vote to no-lynch', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [''],
				input: '!unvote'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'addActionWithoutTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentVoteByPlayer').resolves({
				id: 1,
				name: 'charlie'
			});
			sandbox.stub(mafiaDAO, 'revokeAction').resolves();
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.nolynchHandler(command).then(() => {
				const output = view.respond.getCall(0).args[1];
				output.should.include('@tehNinja voted for no-lynch in post ');

				mafiaDAO.addActionWithoutTarget.called.should.be.true;
				view.respond.called.should.be.true;

				
			});
		});
	});

	describe('join()', () => {
		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.joinHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should not allow duplicates', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};

			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.prep);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPlayerToGame').resolves();
			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');

			return mafia.joinHandler(command).then( () => {
				mafiaDAO.addPlayerToGame.called.should.be.false;
				view.reportError.called.should.be.true;
				
				const output = view.reportError.getCall(0).args[2];
				output.should.include('You are already in this game, @tehNinja!');
			});
		});

		it('should report errors', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};

			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.prep);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'addPlayerToGame').rejects('I AM ERROR');
			
			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');

			return mafia.joinHandler(command).then( () => {
				view.reportError.called.should.be.true;
				
				const preface = view.reportError.getCall(0).args[1];
				preface.should.include('Error when adding to game:');
			});

		});

		it('should not allow joining a game already in progress', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'addPlayerToGame').resolves();

			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'reportError');

			return mafia.joinHandler(command).then( () => {
				mafiaDAO.addPlayerToGame.called.should.be.false;
				view.reportError.called.should.be.true;
				
				const output = view.reportError.getCall(0).args[2];
				output.should.include('Cannot join game in progress.');
			});
		});

		it('should facilitate joining', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.prep);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'addPlayerToGame').resolves();

			sandbox.stub(view, 'respond');

			return mafia.joinHandler(command).then( () => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('Welcome to the game, @tehNinja');
			});
		});
	});
	
	describe('list-all-players()', () => {
		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.listAllPlayersHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should report players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'},
				{player: {'name': 'dreikin', properName: 'dreikin'}, 'playerStatus': 'mod'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listAllPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('Yamikuronue');
				output.should.include('accalia');
				output.should.include('dreikin');
			});
		});
		
		it('should report when no living players exist', () => {
			//TODO: Probably a 'game over' message?
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'dead'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listAllPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('###Living:\nNobody! Aren\'t you special?\n');
			});
		});
		
		it('should report when no dead players exist', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'},
				{player: {'name': 'dreikin', properName: 'dreikin'}, 'playerStatus': 'mod'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listAllPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('###Dead:\nNobody! Aren\'t you special?\n');
			});
		});
		
		it('should report when there are no mods', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listAllPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('###Mod(s):\nNone. Weird.');
			});
		});
	});
	
	describe('list-players()', () => {
		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.listPlayersHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should report only living players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'},
				{player: {'name': 'dreikin', properName: 'dreikin'}, 'playerStatus': 'mod'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('Yamikuronue');
				output.should.not.include('accalia');
				output.should.include('dreikin');
			});
		});
		
		it('should report lack of living players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue'}, 'playerStatus': 'dead'},
				{player: {'name': 'accalia'}, 'playerStatus': 'dead'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			sandbox.stub(view, 'respond');

			return mafia.listPlayersHandler(command).then(() => {
				view.respond.called.should.be.true;
				
				const output = view.respond.getCall(0).args[1];
				output.should.include('Nobody! Aren\'t you special?\n');
				output.should.not.include('accalia');
				output.should.not.include('yamikuronue');
				output.should.include('None. Weird.');
			});
		});
	});
	
	describe('list-votes()', () => {
		it ('should remain silent when no game is in session', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respondInThread');
			sandbox.stub(view, 'reportError');
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'ensureGameExists').rejects();

			return mafia.listVotesHandler(command).then(() => {
				view.respondInThread.called.should.be.false;
				view.reportError.called.should.be.false;
				
			});
		});

		it('should output votes', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];

			
			const votes = [
				{
					target: {
						name: 'accalia',
						properName: 'accalia'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 123,
					isCurrent: true,
					rescindedAt: null
				}
			];
			
			
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(42);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(69);
			sandbox.stub(mafiaDAO, 'getAllVotesForDaySorted').resolves(votes);
			sandbox.stub(mafiaDAO, 'getLivingPlayers').resolves(players);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			const fakeTemplate = sandbox.stub().returns('Some string output');
			sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
			
			sandbox.stub(view, 'respondWithTemplate');

			return mafia.listVotesHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const dataSent = view.respondWithTemplate.getCall(0).args[1];
				
				dataSent.numPlayers.should.equal(2);
				dataSent.notVoting.should.include('accalia');
				dataSent.notVoting.should.not.include('Yamikuronue');
				dataSent.numNotVoting.should.equal(1);
				dataSent.votes.accalia.names.length.should.equal(1);
				dataSent.votes.accalia.names.should.include({
						voter: 'Yamikuronue',
						retracted: false,
						retractedAt: null,
						post: 123,
						game: 12345
				});
			});
		});
		
		it('should output outdated votes', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];

			
			const votes = [
				{
					target: {
						name: 'tehninja',
						properName: 'tehNinja'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 121,
					isCurrent: false,
					rescindedAt: 123
				},
				{
					target: {
						name: 'accalia',
						properName: 'accalia'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 123,
					isCurrent: true,
					rescindedAt: null
				}
			];
			
			
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(42);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(69);
			sandbox.stub(mafiaDAO, 'getAllVotesForDaySorted').resolves(votes);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'getLivingPlayers').resolves(players);
			const fakeTemplate = sandbox.stub().returns('Some string output');
			sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
			
			sandbox.stub(view, 'respondWithTemplate');

			return mafia.listVotesHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const dataSent = view.respondWithTemplate.getCall(0).args[1];

				dataSent.votes.accalia.names.length.should.equal(1);
				dataSent.votes.accalia.names.should.include({
						voter: 'Yamikuronue',
						retracted: false,
						retractedAt: null,
						post: 123,
						game: 12345
				});
				dataSent.votes.tehNinja.names.length.should.equal(1);
				dataSent.votes.tehNinja.names.should.include({
						voter: 'Yamikuronue',
						retracted: true,
						retractedAt: 123,
						post: 121,
						game: 12345
				});
			});
		});
		
		it('should output mod of 0 for vanilla', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];

			
			const votes = [
				{
					target: {
						name: 'accalia',
						properName: 'accalia'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 123,
					isCurrent: true,
					rescindedAt: null
				}
			];
			
			
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(42);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(69);
			sandbox.stub(mafiaDAO, 'getAllVotesForDaySorted').resolves(votes);
			sandbox.stub(mafiaDAO, 'getLivingPlayers').resolves(players);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			const fakeTemplate = sandbox.stub().returns('Some string output');
			sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
			
			sandbox.stub(view, 'respondWithTemplate');
			
			return mafia.listVotesHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const dataSent = view.respondWithTemplate.getCall(0).args[1];
				
				dataSent.votes.accalia.mod.should.equal(0);
			});
		});
		
		it('should output mod of +1 for loved', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];

			
			const votes = [
				{
					target: {
						name: 'accalia',
						properName: 'accalia'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 123,
					isCurrent: true,
					rescindedAt: null
				}
			];
			
			
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(42);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(69);
			sandbox.stub(mafiaDAO, 'getAllVotesForDaySorted').resolves(votes);
			sandbox.stub(mafiaDAO, 'getLivingPlayers').resolves(players);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('loved');
			const fakeTemplate = sandbox.stub().returns('Some string output');
			sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
			
			sandbox.stub(view, 'respondWithTemplate');
			
			return mafia.listVotesHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const dataSent = view.respondWithTemplate.getCall(0).args[1];
				
				dataSent.votes.accalia.mod.should.equal(1);
			});
		});
		
		it('should output mod of -1 for hated', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			
			const players = [
				{player: {'name': 'yamikuronue', properName: 'Yamikuronue'}, 'playerStatus': 'alive'},
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];

			
			const votes = [
				{
					target: {
						name: 'accalia',
						properName: 'accalia'
					},
					player: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 123,
					isCurrent: true,
					rescindedAt: null
				}
			];
			
			
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(42);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(69);
			sandbox.stub(mafiaDAO, 'getAllVotesForDaySorted').resolves(votes);
			sandbox.stub(mafiaDAO, 'getLivingPlayers').resolves(players);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('hated');
			const fakeTemplate = sandbox.stub().returns('Some string output');
			sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
			
			sandbox.stub(view, 'respondWithTemplate');
			
			return mafia.listVotesHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const dataSent = view.respondWithTemplate.getCall(0).args[1];
				
				dataSent.votes.accalia.mod.should.equal(-1);
			});
		});
	});
});
