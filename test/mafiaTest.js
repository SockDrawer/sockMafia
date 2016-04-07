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
const view = require('../src/view.js');
const modController = require('../src/mod_controller');
const playerController = require('../src/player_controller');

const fakeConfig = {
	mergeObjects: sinon.stub().returns({
		db: './mafiadbTesting'
	}),
	core: {
		owner: 'tehNinja',
		username: 'votebot'
	}
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
				
			});
		});

		it('Should path in mod commands', () => {
			const events = {
				onCommand: commandSpy,
				onNotification: notificationSpy
			};
			sandbox.stub(mafiaDAO, 'createDB').resolves();
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(modController);
			sandbox.stub(playerController);

			mafia.prepare(null, fakeConfig, events, undefined).then(() => {
				expect(mafia.prepHandler).to.be.a('function');
				expect(mafia.startHandler).to.be.a('function');
				expect(mafia.setHandler).to.be.a('function');
				expect(mafia.dayHandler).to.be.a('function');
				expect(mafia.killHandler).to.be.a('function');
				expect(mafia.finishHandler).to.be.a('function');

				commandSpy.calledWith('prepare').should.be.true;
				commandSpy.calledWith('start').should.be.true;
				commandSpy.calledWith('set').should.be.true;
				commandSpy.calledWith('new-day').should.be.true;
				commandSpy.calledWith('kill').should.be.true;
				commandSpy.calledWith('end').should.be.true;
				
			});
		});

		it('Should path in player commands', () => {
			const events = {
				onCommand: commandSpy,
				onNotification: notificationSpy
			};
			sandbox.stub(mafiaDAO, 'createDB').resolves();
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
			sandbox.stub(modController);
			sandbox.stub(playerController);

			mafia.prepare(null, fakeConfig, events, undefined).then(() => {
				expect(mafia.nolynchHandler).to.be.a('function');
				expect(mafia.unvoteHandler).to.be.a('function');
				expect(mafia.voteHandler).to.be.a('function');
				expect(mafia.joinHandler).to.be.a('function');
				expect(mafia.listPlayersHandler).to.be.a('function');
				expect(mafia.listAllPlayersHandler).to.be.a('function');
				expect(mafia.listVotesHandler).to.be.a('function');

				commandSpy.calledWith('nolynch').should.be.true;
				commandSpy.calledWith('unvote').should.be.true;
				commandSpy.calledWith('vote').should.be.true;
				commandSpy.calledWith('for').should.be.true;
				commandSpy.calledWith('list-players').should.be.true;
				commandSpy.calledWith('list-all-players').should.be.true;
				commandSpy.calledWith('list-votes').should.be.true;
				
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

			sandbox.stub(view, 'respond');
			mafia.internals.browser = browser;

			return mafia.echoHandler(command).then( () => {
				view.respond.calledWith(command,
				'topic: ' + command.post.topic_id + '\n'
				+ 'post: ' + command.post.post_number + '\n'
				+ 'input: `' +	command.input + '`\n'
				+ 'command: `' + command.command + '`\n'
				+ 'args: `' + command.args + '`\n' +
				'mention: `' + command.mention + '`\n'
				+ 'post:\n[quote]\n' + command.post.cleaned + '\n[/quote]'
				).should.be.true;
			});
		});
	});
});
