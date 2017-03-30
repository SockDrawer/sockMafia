'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(require('sinon-chai'));

chai.should();

const PlayerController = require('../../src/player_controller');
const ModController = require('../../src/mod_controller');
const DAO = require('../../src/dao');
const view = require('../../src/view.js');

const testConfig = {
	db: ':memory:',
	options: {
		chats: 'on'
	}
};

const mockForum = {
	Chat: {
		create: () => 1
	},
	User: {
		getByName: (user) => {
			return user;
		}
	},
	Post: {
		reply: () => {
			return Promise.resolve();
		}
	},
	supports: (input) => {
		return input === 'Chats' || input === 'Formatting.Markup.HTML' || input === 'Formatting.Multiline';
	}
};


describe('Postman Scenarios', function () {

	this.timeout(50000);
	let sandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		//Stub view methods for output trapping
		sandbox.spy(view, 'respondInThread');
		sandbox.spy(view, 'reportError');
		sandbox.spy(view, 'respondWithTemplate');
		sandbox.spy(view, 'respond');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('Postman adding chat bug', function () {
		let dao, playerController, game;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			view.activate(mockForum);

			playerController.forum = mockForum;

			return dao.createGame(1, 'Game 1')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.setValue('chats', 'on'))
				.then(() => game.setValue('postman', 'on'))
				.then(() => game.setValue('postman-cc', 2)) //Not sure if this and the next line are necessary, but they were set when we found the bug
				.then(() => game.setValue('postman-public', 'day'))
				.then(() => game.newDay());
		});

		after(() => {
			dao.getGameByTopicId.restore();
		});

		it('Should add postman chats to the game', () => {
			let command = {
				args: 'to Accalia hi this is a test'.split(' '),
				line: '!whisper to Accalia hi this is a test',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 100}),
				getUser: () => Promise.resolve({username: 'dreikin'}),
				parent: {
					ids: {
						topic: 1
					}
				}
			};

			sandbox.spy(game, 'addAlias');
			sandbox.spy(game, 'addChat');
			sandbox.stub(mockForum.Chat, 'create').resolves({
				send: sandbox.stub().resolves(),
				id: 123
			});
			return playerController.createChatHandler(command).then(() => {
				view.reportError.should.not.be.called;
				mockForum.Chat.create.should.be.called;
				game.addChat.should.be.called;
				game.addAlias.should.be.called;
				game.addAlias.firstCall.args[0].should.equal('c_123');
			}).then(() => {
				command = {
					args: [],
					line: '!list-votes',
					reply: sandbox.stub(),
					getUser: () => Promise.resolve({username: 'accalia'}),
					parent: {
						ids: {
							topic: 123
						}
					}
				};


				return playerController.listVotesHandler(command);
			}).then(() => {
				const output = command.reply.firstCall.args[0];
				output.should.include('<u>Votecount for Day');
			});
		});
	});
});
