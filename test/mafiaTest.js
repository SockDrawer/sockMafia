'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
require('chai-as-promised');

chai.should();
const expect = chai.expect;

const mafia = require('../src/mafiabot');
const mafiaDAO = require('../src/dao.js');
const Handlebars = require('handlebars');

const fakeConfig = {
	mergeObjects: sinon.stub().returns({
		db: './mafiadbTesting'
	})
};

const browser = {
	createPost: sinon.stub().yields()
};

describe('mafia', () => {

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

	it('should export prepare()', () => {
		expect(mafia.prepare).to.be.a('function');
	});
	it('should export start()', () => {
		expect(mafia.start).to.be.a('function');
	});
	it('should export stop()', () => {
		expect(mafia.stop).to.be.a('function');
	});
	it('should have start() as a stub function', () => {
		expect(mafia.start).to.not.throw();
	});
	it('should have stop() as a stub function', () => {
		expect(mafia.stop).to.not.throw();
	});

	describe('prepare()', () => {	
		it('Should register commands', () => {
			const events = {
				onCommand: commandSpy,
				onNotification: notificationSpy
			};
			sandbox.stub(mafiaDAO, 'createDB').resolves();
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();

			mafia.prepare(null, fakeConfig, events, undefined).then(() => {
				commandSpy.calledWith('for').should.be.true;
				commandSpy.calledWith('join').should.be.true;
				commandSpy.calledWith('list-all-players').should.be.true;
				commandSpy.calledWith('list-players').should.be.true;
				commandSpy.calledWith('list-votes').should.be.true;
				commandSpy.calledWith('kill').should.be.true;
				commandSpy.calledWith('new-day').should.be.true;
				commandSpy.calledWith('set').should.be.true;
			});
		});
	});

	describe('echo()', () => {

		it('should echo what is passed in', () => {
			const command = {
				post: {
					'topic_id': 12345,
					'post_number': 98765,
					input: 'this is input',
					command: 'a command',
					args: 'a b c',
					mention: 'mention',
					post: {
						cleaned: 'squeaky!'
					}
				}
			};

			mafia.internals.browser = browser;

			return mafia.echoHandler(command).then( () => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number,
				'topic: ' + command.post.topic_id + '\n' + 'post: ' + command.post.post_number + '\n' + 'input: `' +
				command.input + '`\n' + 'command: `' + command.command + '`\n' + 'args: `' + command.args + '`\n' +
				'mention: `' + command.mention + '`\n' + 'post:\n[quote]\n' + command.post.cleaned +
				'\n[/quote]').should.be.true;
			});
		});
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').onFirstCall().resolves(true).onSecondCall().resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').onFirstCall().resolves(true).onSecondCall().resolves(false);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(false);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.night);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'addVote').resolves(false);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
				output.should.include(':wtf:\nSorry, @tehNinja: your vote failed.  No, I don\'t know why.');
			});
		});
		
		it('should echo when you rescind your vote', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: ['@unvote'],
				input: '!for @unvote'
			};

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(100);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(1);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
				output.should.include('@tehNinja rescinded their vote in post ' +
					'#<a href="https://what.thedailywtf.com/t/12345/98765">98765</a>.');
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(100);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(1);
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');

			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
				output.should.include('@tehNinja voted for @noLunch in post ' +
					'#<a href="https://what.thedailywtf.com/t/12345/98765">98765</a>.');
			});
		});
		
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(3);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;

				const output = browser.createPost.getCall(1).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(3);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('loved');
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(4);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('loved');
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;

				const output = browser.createPost.getCall(1).args[2];
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(2);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('vanilla');
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
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

			mafia.internals.browser = browser;
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerAlive').resolves(true);
			sandbox.stub(mafiaDAO, 'getCurrentTime').resolves(mafiaDAO.gameTime.day);
			sandbox.stub(mafiaDAO, 'getNumToLynch').resolves(3);
			sandbox.stub(mafiaDAO, 'getCurrentDay').resolves(1);
			sandbox.stub(mafiaDAO, 'getNumVotesForPlayer').resolves(2);
			sandbox.stub(mafiaDAO, 'getPlayerProperty').resolves('hated');
			sandbox.stub(mafiaDAO, 'addVote').resolves(true);
			
			sandbox.stub(mafiaDAO, 'killPlayer').resolves({player: {properName: 'noLunch'}});
			sandbox.stub(mafiaDAO, 'setCurrentTime').resolves();


			return mafia.voteHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				mafiaDAO.killPlayer.called.should.be.true;
				mafiaDAO.setCurrentTime.calledWith(12345, mafiaDAO.gameTime.night).should.be.true;

				const output = browser.createPost.getCall(1).args[2];
				output.should.include('@noLunch has been lynched! Stay tuned for the flip. <b>It is now Night.</b>');
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
			mafia.internals.browser = browser;

			return mafia.joinHandler(command).then( () => {
				mafiaDAO.addPlayerToGame.called.should.be.false;
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
			
			mafia.internals.browser = browser;

			return mafia.joinHandler(command).then( () => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
				output.should.include('Error when adding to game:');
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

			mafia.internals.browser = browser;

			return mafia.joinHandler(command).then( () => {
				mafiaDAO.addPlayerToGame.called.should.be.false;
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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

			mafia.internals.browser = browser;

			return mafia.joinHandler(command).then( () => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;

				const output = browser.createPost.getCall(0).args[2];
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
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};

			return mafia.listAllPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};

			return mafia.listAllPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'alive'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};

			return mafia.listAllPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: []
			};

			return mafia.listAllPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
				{player: {'name': 'accalia', properName: 'accalia'}, 'playerStatus': 'dead'}
			];


			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(mafiaDAO, 'getAllPlayers').resolves(players);
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};

			return mafia.listPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: []
			};

			return mafia.listPlayersHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				const output = browser.createPost.getCall(0).args[2];
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];
				
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];

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
		
		it('should not output the unvote hack', () => {
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
					rescindedAt: 122
				},
				{
					target: {
						name: 'unvote',
						properName: 'unvote'
					},
					voter: {
						name: 'yamikuronue',
						properName: 'Yamikuronue'
					},
					post: 122,
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
				},
				{
					target: {
						name: 'nolynch',
						properName: 'noLynch'
					},
					voter: {
						name: 'accalia',
						properName: 'accalia'
					},
					post: 125,
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];

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
						retractedAt: 122,
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];
				
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];
				
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
			
			mafia.internals.browser = browser;
			mafia.internals.configuration = {
				mods: ['dreikin']
			};
			
			return mafia.listVotesHandler(command).then(() => {
				browser.createPost.calledWith(command.post.topic_id, command.post.post_number).should.be.true;
				
				fakeTemplate.called.should.be.true;
				const dataSent = fakeTemplate.getCall(0).args[0];
				
				dataSent.votes.accalia.mod.should.equal(-1);
			});
		});
	});
});
