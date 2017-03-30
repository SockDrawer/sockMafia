'use strict';
/*globals describe, it*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const sinon = require('sinon');

const sockMafia = require('../../src/mafiabot');
const PlayerController = require('../../src/player_controller');
const  ModController = require('../../src/mod_controller');

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
		},

		addExtendedHelp: (name, help) => {
			return Promise.resolve();
		},

		addAlias: (name, help, handler) => {
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
			},
			supports: (input) => {
				return input === 'Chats' || input === 'Formatting.Markup.HTML' || input === 'Formatting.Multiline';
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
		let playerController, modController;
		let knownCommands;
		before(() => {
			playerController = new PlayerController(require('../../src/dao'), null);
			modController = new ModController(require('../../src/dao'), null);

			knownCommands = {
				'for': playerController.forHandler,
				'join': playerController.joinHandler,
				'list-all-players': playerController.listAllPlayersHandler,
				'list-players': playerController.listPlayersHandler,
				'list-votes': playerController.listVotesHandler,
				'no-lynch': playerController.nolynchHandler,
				'nolynch': playerController.nolynchHandler,
				'unvote': playerController.unvoteHandler,
				'vote': playerController.voteHandler,
				'set': modController.setHandler,
				'kill': modController.killHandler
			};
		});

		it('Should register the correct commands', () => {
			return mafiabot.activate().then(() => {
				for (const command in knownCommands) {
					Object.keys(Commands.commandList).should.include(command);
				}
			});
		});
	});
});
