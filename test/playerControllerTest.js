'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
require('chai-as-promised');

chai.should();
const expect = chai.expect;

const mafia = require('../src/player_controller');
const mafiaDAO = require('../src/dao.js');
const Handlebars = require('handlebars');
const view = require('../src/view.js');
const validator = require('../src/validator.js');

const fakeConfig = {
	mergeObjects: sinon.stub().returns({
		db: './mafiadbTesting'
	})
};

const browser = {
	createPost: sinon.stub().yields()
};

describe('player controller', () => {

	let sandbox, notificationSpy, commandSpy;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mafia.createDB = sandbox.stub();
		notificationSpy = sinon.spy();
		commandSpy = sinon.spy();
		browser.createPost.reset();
	});
	afterEach(() => {
		sandbox.restore();
	});

	describe('for()', () => {
		it('should reject votes from non-players', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('You are not yet a player.');
			});
		});
		
		it('should reject votes for non-players', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').onFirstCall().resolves(true).onSecondCall().resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('your princess is in another castle.');
			});
		});
		
		it('should reject votes from the dead', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').onFirstCall().resolves(true).onSecondCall().resolves(false);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('You would be wise to not speak ill of the dead.');
			});
		});

		it('should reject votes for the dead', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(false);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('Aaagh! Ghosts!');
			});
		});
		
		it('should reject votes at night', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.night);
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('It is not day');
			});
		});

		it('should announce voting failures', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(validator, 'isDaytime').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves();
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(false);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include(':wtf:\nSorry, @tehNinja: your vote failed.  No, I don\'t know why.');
			});
		});
	
		it('should echo your vote when successful', () => {
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
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(100);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(1);
			sandbox.stub(mafiaDAO, 'getCurrentActionByPlayer').resolves();
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('@tehNinja voted for @noLunch in post ' +
					'#<a href="https://what.thedailywtf.com/t/12345/98765">98765</a>.');
			});
		});
	});
	
	describe('Auto-lynch functionality', () => {		
		it('should auto-lynch at the threshold', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(3);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;
				view.respond.called.should.be.true;
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('@noLunch has been lynched! Stay tuned for the flip. <b>It is now Night.</b>');
			});
		});
	
		it('should not auto-lynch loved players at the lynch count', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(3);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('loved');
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				view.respond.called.should.be.true;
				mafiaDAO.killPlayer.called.should.be.false;
			});
		});
		
		it('should auto-lynch at num+1 for loved players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(4);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('loved');
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;
				view.respond.called.should.be.true;
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('@noLunch has been lynched! Stay tuned for the flip. <b>It is now Night.</b>');
			});
		});
		
		it('should not auto-lynch vanilla players at the lynch-1', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(2);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				view.respond.called.should.be.true;
				mafiaDAO.killPlayer.called.should.be.false;
			});
		});
		
		it('should auto-lynch at num+1 for loved players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@noLunch'],
				input: '!for @noLunch'
			};

			sandbox.stub(view, 'respond');
			sandbox.stub(view, 'respondInThread');
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(2);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('hated');
			sandbox.stub(mafiaDAO, 'addActionWithTarget').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;

				view.respond.called.should.be.true;
				view.respondInThread.called.should.be.true;
				
				const output = view.respondInThread.getCall(0).args[1];
				output.should.include('@noLunch has been lynched! Stay tuned for the flip. <b>It is now Night.</b>');
			});
		});
	});

	describe('unvote()', () => {
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
					voter: {
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
					voter: {
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
					voter: {
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
					voter: {
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
					voter: {
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
					voter: {
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
