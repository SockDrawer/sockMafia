'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const rimraf = require('rimraf-promise');

chai.should();

const playerController = require('../src/player_controller');
const DAO = require('../src/dao.js');
const Handlebars = require('handlebars');
const view = require('../src/view.js');

const testConfig = {
	db: 'intTesting.db',

};

describe('Voting', () => {

	let sandbox;

	before(() => {
		//Set up the database
		return rimraf('intTesting.db')
			.then(() => DAO.createDB(testConfig))
			.then(() => DAO.addGame(1, 'testGame'))
			.then(() => DAO.addPlayerToGame(1, 'yamikuronue', DAO.playerStatus.alive))
			.then(() => DAO.addPlayerToGame(1, 'accalia', DAO.playerStatus.alive))
			.then(() => DAO.addPlayerToGame(1, 'dreikin', DAO.playerStatus.alive))
			.then(() => DAO.addMod(1, 'ModdyMcModerson'))
			.then(() => DAO.setGameStatus(1, DAO.gameStatus.running));
	});

	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		//Stub view methods for output trapping
		sandbox.stub(view, 'respondInThread').resolves();
		sandbox.stub(view, 'reportError').resolves();
		sandbox.stub(view, 'respondWithTemplate').resolves();
		sandbox.stub(view, 'respond').resolves();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('Should allow one player to vote for another', () => {
		const command = {
			post: {
				username: 'yamikuronue',
				'topic_id': 1,
				'post_number': 5
			},
			args: ['@accalia'],
			input: '!vote @accalia'
		};

		//Spies
		sandbox.spy(DAO, 'addActionWithTarget');
		return playerController.voteHandler(command).then(() => {
			view.reportError.called.should.equal(false);
			DAO.addActionWithTarget.called.should.equal(true);
			view.respondInThread.firstCall.args[1].should.include('@yamikuronue voted for @accalia');
		});
	});
});