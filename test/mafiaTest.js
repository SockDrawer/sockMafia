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

	describe('plugin()', () => {
		it('should return a plugin object', () => {
			mafia.plugin().should.be.an('object');
		});
		it('should return a plugin object with activate function', () => {
			mafia.plugin().activate.should.be.a('function');
		});
		it('activate function should be exports.activate', () => {
			mafia.plugin().activate.should.equal(mafia.activate);
		});
		it('should return a plugin object with deactivate function', () => {
			mafia.plugin().deactivate.should.be.a('function');
		});
		it('should have deactivate() be a stub', () => {
			mafia.plugin().deactivate().should.eventually.resolve;
		});
		it('should store `forum` in internals', () => {
			const expected = Math.random();
			mafia.plugin(expected);
			mafia.internals.forum.should.equal(expected);
		});
		it('should store `config` in internals', () => {
			const expected = Math.random();
			mafia.plugin(null, {
				bar: expected
			});
			mafia.internals.configuration.should.eql({
				cooldown: 0,
				db: './mafiadb',
				messages: ['Command invalid or no command issued. Try the `help` command.'],
				voteBars: 'bastard',
				bar: expected
			});
		});
		it('should store accept array for `config`', () => {
			const expected = Math.random();
			mafia.plugin(null, [expected]);
			mafia.internals.configuration.should.eql({
				cooldown: 0,
				db: './mafiadb',
				messages: [expected],
				voteBars: 'bastard'
			});
		});
		it('should not override config setting with defaults', () => {
			const expected = Math.random();
			mafia.plugin(null, {
				db: expected
			});
			mafia.internals.configuration.should.eql({
				cooldown: 0,
				db: expected,
				messages: ['Command invalid or no command issued. Try the `help` command.'],
				voteBars: 'bastard'
			});
		});

		it('should not mess with players array (incorrect?)', () => {
			const expected = Math.random();
			mafia.plugin(null, {
				players: [expected]
			});
			mafia.internals.configuration.should.eql({
				cooldown: 0,
				db: './mafiadb',
				messages: ['Command invalid or no command issued. Try the `help` command.'],
				voteBars: 'bastard',
				players: [expected]
			});
		});
	});
	describe('activate', () => {
		let config = null,
			forum = null;
		beforeEach(() => {
			config = {
				thread: Math.random(),
				players: [Math.random()],
				mods: [Math.random()],
				name: Math.random()
			};
			forum = {
				username: Math.random(),
				owner: {
					username: Math.random()
				},
				Commands: {
					add: sinon.stub()
				}
			};
			mafia.internals.configuration = config;
			mafia.internals.forum = forum;
			sandbox.stub(mafiaDAO, 'createDB').resolves();
			sandbox.stub(mafiaDAO, 'addPlayerToGame').resolves();
			sandbox.stub(mafiaDAO, 'ensureGameExists').resolves();
		});
		it('should register commands', () => {
			return mafia.activate().then(() => {
				forum.Commands.add.calledWith('for').should.be.true;
				forum.Commands.add.calledWith('join').should.be.true;
				forum.Commands.add.calledWith('list-all-players').should.be.true;
				forum.Commands.add.calledWith('list-players').should.be.true;
				forum.Commands.add.calledWith('list-votes').should.be.true;

			});
		});
		it('Should patch in mod commands', () => {
			sandbox.stub(modController);
			sandbox.stub(playerController);

			return mafia.activate().then(() => {
				expect(mafia.prepHandler).to.be.a('function');
				expect(mafia.startHandler).to.be.a('function');
				expect(mafia.setHandler).to.be.a('function');
				expect(mafia.dayHandler).to.be.a('function');
				expect(mafia.killHandler).to.be.a('function');
				expect(mafia.finishHandler).to.be.a('function');

				forum.Commands.add.calledWith('prepare').should.be.true;
				forum.Commands.add.calledWith('start').should.be.true;
				forum.Commands.add.calledWith('set').should.be.true;
				forum.Commands.add.calledWith('new-day').should.be.true;
				forum.Commands.add.calledWith('kill').should.be.true;
				forum.Commands.add.calledWith('end').should.be.true;

			});
		});
		it('Should patch in player commands', () => {
			sandbox.stub(modController);
			sandbox.stub(playerController);

			return mafia.activate().then(() => {
				expect(mafia.nolynchHandler).to.be.a('function');
				expect(mafia.unvoteHandler).to.be.a('function');
				expect(mafia.voteHandler).to.be.a('function');
				expect(mafia.joinHandler).to.be.a('function');
				expect(mafia.listPlayersHandler).to.be.a('function');
				expect(mafia.listAllPlayersHandler).to.be.a('function');
				expect(mafia.listVotesHandler).to.be.a('function');

				forum.Commands.add.calledWith('nolynch').should.be.true;
				forum.Commands.add.calledWith('unvote').should.be.true;
				forum.Commands.add.calledWith('vote').should.be.true;
				forum.Commands.add.calledWith('for').should.be.true;
				forum.Commands.add.calledWith('list-players').should.be.true;
				forum.Commands.add.calledWith('list-all-players').should.be.true;
				forum.Commands.add.calledWith('list-votes').should.be.true;

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

			return mafia.echoHandler(command).then(() => {
				view.respond.calledWith(command,
					'topic: ' + command.post.topic_id + '\n' + 'post: ' + command.post.post_number + '\n' + 'input: `' + command.input + '`\n' + 'command: `' + command.command + '`\n' + 'args: `' + command.args + '`\n' +
					'mention: `' + command.mention + '`\n' + 'post:\n[quote]\n' + command.post.cleaned + '\n[/quote]'
				).should.be.true;
			});
		});
	});
});
