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
const view = require('../src/view.js');

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

			sandbox.stub(view, 'respond');
			mafia.internals.browser = browser;

			return mafia.echoHandler(command).then( () => {
				view.respond.calledWith(command, 'topic: ' + command.post.topic_id + '\n' + 'post: ' + command.post.post_number + '\n' + 'input: `' +
				command.input + '`\n' + 'command: `' + command.command + '`\n' + 'args: `' + command.args + '`\n' +
				'mention: `' + command.mention + '`\n' + 'post:\n[quote]\n' + command.post.cleaned +
				'\n[/quote]').should.be.true;
			});
		});
	});
});
