'use strict';
/*globals describe, it, beforeEach, afterEach, before*/

const chai = require('chai'),
	sinon = require('sinon'),
	nock = require('nock');

//do NOT hit real servers
nock.disableNetConnect();

//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const PlayerController = require('../../src/player_controller');
const ModController = require('../../src/mod_controller');
const DAO = require('../../src/dao');
const view = require('../../src/view.js');

const testConfig = {
	db: ':memory:',
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
	},
	Format: {
		urlForTopic: (topicId, slug, postId) => {
			return '/t/' + slug + '/' + topicId + '/' + postId;
		},
		urlForPost: (postId) => {
			return '/p/' + postId;
		},
		header2: (text) => `<h2>${text}</h2>`,
		header3: (text) => `<h3>${text}</h3>`,
		bold: (text) => `<b>${text}</b>`,
		link: (url, text) => `<a href="${url}">${text}</a>`,
	}
};

describe('MafiaStats', function () {
		let mockCalls = [];
		let sandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
			mockCalls = [];
		});

		afterEach(() => {
			nock.cleanAll();
			sandbox.restore();
		});
		
	describe('Basic game stats', () => {
		let dao, playerController, modController, game;
		
		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};
			modController = new ModController(dao, testConfig);

			
			view.activate(mockForum);

			return dao.createGame(1, 'Game 1')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.addModerator('moddyMcModFace'))
				.then(() => game.newDay());
		});
		
		it('should record basic stats', () => {
			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 1}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
				parent: {
					ids: {
						topic: 1
					}
				}
			};
						
			mockCalls.push(nock('http://mafia.sockdrawer.io:5984')
							.post('/games')
							.reply(201, JSON.stringify({ok: true})));
							
			//First, register a vote
			
			return playerController.voteHandler(command).then(() => {
				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 2}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
					parent: {
						ids: {
							topic: 2
						}
					}
				};

			//Then, unvote
				return playerController.unvoteHandler(command);
			}).then(() => {
				command.reply.lastCall.args[0].should.include('@yamikuronue unvoted');

				command = {
					args: ['@accalia'],
					input: '!vote @accalia',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 3}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
					parent: {
						ids: {
							topic: 2
						}
					}
				};

			//Vote for the same person again
				return playerController.voteHandler(command);
			}).then(() => {
				
				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 4}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
					parent: {
						ids: {
							topic: 2
						}
					}
				};

			//Then unvote
				return playerController.unvoteHandler(command);
			}).then(() => {

				command = {
					args: ['scum'],
					input: '!endGame',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 5}),
					getUser: () => Promise.resolve({username: 'moddyMcModFace'}),
					parent: {
						ids: {
							topic: 2
						}
					}
				};

				return modController.endHandler(command);
			}).then(() => {
				mockCalls[0].isDone().should.be.true;
				game.getValue('winner').should.equal('scum');
			});
		});
	});
});
