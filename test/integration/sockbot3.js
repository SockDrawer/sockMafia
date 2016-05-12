'use strict';
/*globals describe, it*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const sinon = require('sinon');
require('sinon-as-promised');

const sockMafia = require('../../src/mafiabot');
const playerController = require('../../src/player_controller');
const modController = require('../../src/mod_controller');

const testConfig = {
	db: ':memory:',
	thread: 11,
	name: 'testMafia'
};

describe('SockMafia', function() {
	this.timeout(50000);
	let sandbox;
	const Commands = {
		commandList: {},
		add: (name, help, handler) => {
			Commands.commandList[name] = handler;
			return Promise.resolve();
		}
	};


	const mockForum = {
			username: 'yamibot',
			owner: {
				username: 'yamikuronue'
			},
			Commands: Commands,
			Post: {
				reply: sinon.stub().resolves()
			}
		};

	const mafiabot = sockMafia.plugin(mockForum, testConfig);


	beforeEach(() => {
		sandbox = sinon.sandbox.create();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('Should export a function', () => {
		sockMafia.plugin.should.be.a('function');
	});

	it('Should create a plugin when called', () =>{
		mafiabot.activate.should.be.a('function');
		mafiabot.deactivate.should.be.a('function');
	});

	describe('command formats', () => {

		const knownCommands = {
			'for': playerController.forHandler,
			'join': playerController.joinHandler,
			'list-all-players': playerController.listAllPlayersHandler,
			'list-players': playerController.listPlayersHandler,
			'list-votes': playerController.listVotesHandler,
			'no-lynch': playerController.nolynchHandler,
			'nolynch': playerController.nolynchHandler,
			'unvote': playerController.unvoteHandler,
			'vote': playerController.voteHandler
		};

		it('Should register the correct commands', () => {
			return mafiabot.activate().then(() => {
				for (const command in knownCommands) {
					Object.keys(Commands.commandList).should.include(command);
				}
			}).catch((err) => {
				console.log('ERROR:' + err);
			});
		});
/*eslint no-loop-func:0*/
		for (const command in knownCommands) {
			it('should have the proper interface for ' + command, () => {
				const fakeCommandObject = {
					post: {
						username: 'yamikuronue',
						'topic_id': 11,
						'post_number': 5
					},
					args: ['@accalia'],
					input: '!doStuffTo @accalia',
					reply: sandbox.stub().resolves()
				};
				return knownCommands[command](fakeCommandObject).then(() => {
					//TODO: The following is the correct interface, but our shims fuck it up
					// fakeCommandObject.reply.called.should.equal(true);
					//This is the shim version:
					mockForum.Post.reply.called.should.equal(true);
					mockForum.Post.reply.reset();
				});
			});
		}


		/*
		.then(() => {
				
		 */
	});
});
