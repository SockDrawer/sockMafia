'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const PlayerController = require('../../src/player_controller');
const modController = require('../../src/mod_controller');
const DAO = require('../../src/dao');
const Handlebars = require('handlebars');
const view = require('../../src/view.js');

const testConfig = {
	db: ':memory:',

};

describe('Recorded test cases', function () {
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
	describe('Bushido Mafia II', function () {
		let dao, playerController, game;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			return dao.createGame(20085, 'Bushido Mafia')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addModerator('Yamikuronue');
				})
				.then(() => game.addPlayer('asdf'))
				.then(() => game.addPlayer('error'))
				.then(() => game.addPlayer('fbmac'))
				.then(() => game.addPlayer('Vault_Dweller'))
				.then(() => game.addPlayer('russ0519'))
				.then(() => game.addPlayer('aliceif'))
				.then(() => game.addPlayer('xaade'))
				.then(() => game.addPlayer('Jaloopa'))
				.then(() => game.addPlayer('ChaosTheEternal'))
				.then(() => game.newDay());
		});

		after(() => {
			dao.getGameByTopicId.restore();
		});
		
		it('Onyx revote bug', () => {
			let command = {
				args: ['@fbmac'],
				input: '!vote @fbmac',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 20085}),
				getPost: () => Promise.resolve({id: 911692}),
				getUser: () => Promise.resolve({username: 'error'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');
			
			return playerController.voteHandler(command).then(() => {
				command = {
					args: [''],
					input: '!nolynch',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 20085}),
					getPost: () => Promise.resolve({id: 912533}),
					getUser: () => Promise.resolve({username: 'Vault_Dweller'}),
				};
	
				return playerController.nolynchHandler(command);
			}).then(() => {
				
				command = {
					args: [''],
					input: '!nolynch',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 20085}),
					getPost: () => Promise.resolve({id: 912543}),
					getUser: () => Promise.resolve({username: 'asdf'}),
				};
	
				return playerController.nolynchHandler(command);
			}).then(() => {
				
				view.respond.reset();
				view.reportError.reset();
				game.registerAction.reset();
				
				command = {
					args: ['@fbmac'],
					input: '!vote @fbmac',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 912693}),
					getUser: () => Promise.resolve({username: 'asdf'}),
				};

				return playerController.voteHandler(command);
			}).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.firstCall.args[0].should.include('@asdf voted for @fbmac');
				// During live play, he received "TypeError: Cannot read property 'userslug' of null"
				
				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 4}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};
				
				command = {
					args: [],
					input: '!list-votes',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 5}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};
				
				view.respond.reset();
				view.reportError.reset();
				return playerController.listVotesHandler(command);
			});
		});
		
	});
});
