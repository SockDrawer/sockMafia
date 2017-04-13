'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(require('sinon-chai'));

chai.should();

const view = require('../../src/view');
const nameHelperGenerator = require('../../src/templates/helpers/listNames');
const voteChartGenerator = require('../../src/templates/helpers/voteChart');
const boldHelper = require('../../src/templates/helpers/bold');
const mafia = require('../../src/mafiabot');
const MafiaAction = require('../../src/dao/mafiaAction');
const MafiaUser = require('../../src/dao/mafiaUser');

const Handlebars = require('handlebars');

describe('View helpers', () => {

	let sandbox, fakeFormatter;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mafia.internals.configuration = mafia.defaultConfig;

		fakeFormatter = {
			urlForTopic: (topicId, slug, postId) => {
				return '/t/' + slug + '/' + topicId + '/' + postId;
			},
			urlForPost: (postId) => {
				return '/p/' + postId;
			},
			bold: (text) => `<b>${text}</b>`,
			header: (text) => text,
			subheader: (text) => text,
			link: (url, text) => `<a href="${url}">${text}</a>`
		};
		
	});
	
	afterEach(() => {
		sandbox.restore();
	});
	
	describe('bold()', () => {
		it('should bold input', () => {
			boldHelper(fakeFormatter)('input').should.equal('<b>input</b>');
		});
	});

	describe('listNames()', () => {
		let listNamesHelper;

		beforeEach(() => {
			sandbox.stub(Math, 'random').returns(0);
			listNamesHelper = nameHelperGenerator(fakeFormatter);
		});
	
		it('Should one player without a comma', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				}
			}];
			const output = listNamesHelper(input).toString();
			output.should.contain('yamikuronue');
			output.should.not.contain(',');
		});
		
		it('Should link to the post', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				}
			}];
			sandbox.spy(fakeFormatter, 'urlForPost');
			listNamesHelper(input).toString().should.contain('/p/43');
			
			fakeFormatter.urlForPost.called.should.be.true;
			const args = fakeFormatter.urlForPost.getCall(0).args;
			args[0].should.equal(43);
		});
		
		it('Should bold current posts', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				},
				isCurrent: true
			}];
			sandbox.spy(fakeFormatter, 'bold');
			listNamesHelper(input);
			fakeFormatter.bold.should.have.been.called;
		});
		
		it('Should strikeout retracted posts', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				},
				isCurrent: false,
				revokedId: 44
			}];
			const output = listNamesHelper(input).toString();
			output.should.contain('<s>');
			output.should.contain('</s>');


		});
		
		it('Should link to the retraction', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				},
				isCurrent: false,
				revokedId: 44
			}];
			sandbox.spy(fakeFormatter, 'urlForPost');
			listNamesHelper(input).toString().should.contain('/p/44');

			fakeFormatter.urlForPost.calledTwice.should.be.true;
			const args = fakeFormatter.urlForPost.getCall(1).args;
			args[0].should.equal(44);

		});

		it('Should list two votes with a comma', () => {
			const input = [{
				game: 123,
				postId: 43,
				actor: {
					username: 'yamikuronue'
				},
				isCurrent: true
			},
			{
				game: 123,
				postId: 47,
				actor: {
					username: 'accalia'
				},
				isCurrent: true
			}];
			listNamesHelper(input).toString().should.contain('/p/43');
			listNamesHelper(input).toString().should.contain('/p/47');
			listNamesHelper(input).toString().should.contain(',');
			listNamesHelper(input).toString().should.contain('yamikuronue');
			listNamesHelper(input).toString().should.contain('accalia');
		});
		
		it('Should handle real actions', () => {
			const yami = new MafiaUser({
				username: 'yamikuronue'
			});
			
			const accalia = new MafiaUser({
				username: 'accalia'
			});
			
			const dreikin = new MafiaUser({
				username: 'dreikin'
			});
			
			const fakeGame = {
				_getPlayer: (name) => {
					if (name === 'yamikuronue') {
						return yami;
					}
					
					if (name === 'dreikin') {
						return dreikin;
					}
					
					return accalia;
				}
			};
			
			const voteOne = new MafiaAction({
				postId: 1,
				actor: 'yamikuronue',
				target: 'accalia',
				isCurrent: true,
				day: 1
				
			}, fakeGame);
			
			const voteTwo = new MafiaAction({
				postId: 2,
				actor: 'dreikin',
				target: 'accalia',
				isCurrent: false,
				revokedId: 3,
				day: 1
				
			}, fakeGame);
			
			const output = listNamesHelper([voteOne, voteTwo]).toString();
			output.should.contain('<a href="/p/1"><b>yamikuronue</b></a>');
			output.should.contain('<a href="/p/2"><s>dreikin</s></a> <a href="/p/3">[X]</a>');
		});
	});
	
	describe('voteChart()', () => {

		let voteChartHelper;
		beforeEach(() => {
			voteChartHelper = voteChartGenerator(fakeFormatter);
		});

		const colors = {
			DARK_RED: '#560000',
			RED: '#AC1717',
			DARK_GREEN: '#005600',
			GREEN: '#617500',
			LIGHT_GREEN: '#B6CF3F',
			WHITE: '#FFFFFF'
		};

		function decode(string) {
			const capture = /<img src="data:image\/svg\+xml;base64,(.+)">/i;
			const b64 = capture.exec(string)[1];
			return new Buffer(b64, 'base64').toString('ascii');
		}
		
		it('Should produce a 100x12 image', () => {
			const output = decode(voteChartHelper(1, 0, 12).toString());
			output.should.contain('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="12">');
		});
		
		it('Should fill the right percent of the bar for vanila', () => {
			let output = decode(voteChartHelper(1, 0, 2).toString());
			output.should.contain('<rect x="50%" width="50" height="100%"');
			
			output = decode(voteChartHelper(1, 0, 4).toString());
			output.should.contain('<rect x="75%" width="25" height="100%"');
			
			output = decode(voteChartHelper(3, 0, 4).toString());
			output.should.contain('<rect x="25%" width="75" height="100%"');
		});
		
		it('Should fill normal votes with green on white', () => {
			const output = decode(voteChartHelper(1, 0, 12).toString());
			output.should.contain('fill="' + colors.DARK_GREEN);
			output.should.contain('fill="' + colors.WHITE);
		});
		
		it('Should fill hammer with green on light green', () => {
			const output = decode(voteChartHelper(11, 0, 12).toString());
			output.should.contain('fill="' + colors.GREEN);
			output.should.contain('fill="' + colors.LIGHT_GREEN);
		});
		
		it('Should fill dead with dark red on red', () => {
			const output = decode(voteChartHelper(12, 0, 12).toString());
			output.should.contain('fill="' + colors.DARK_RED);
			output.should.contain('fill="' + colors.RED);
		});

		describe('bastard bars', () => {

			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12, 'bastard').toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
			});
			
			it('Should fill hammer when loved is dead', () => {
				const output = decode(voteChartHelper(12, +1, 12, 'bastard').toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 3, 'bastard').toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
			});
			
			it('Should reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5, 'bastard').toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
			});
		});


		describe('hidden bars', () => {

			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12, 'hidden').toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
			});

			it('Should fill hammer when loved is in normal hammer', () => {
				const output = decode(voteChartHelper(11, +1, 12, 'hidden').toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should fill hammer when loved would be dead', () => {
				const output = decode(voteChartHelper(12, +1, 12, 'hidden').toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should not reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 4, 'hidden').toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.not.contain('1/4');
			});
			
			it('Should not reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5, 'hidden').toString());
				output.should.contain('<rect x="80%" width="20" height="100%"');
				output.should.not.contain('1/4');
			});
		});

		describe('open bars', () => {

			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12, 'open').toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
				output.should.contain('11/11');
			});
			
			it('Should fill hammer when loved is dead', () => {
				const output = decode(voteChartHelper(12, +1, 12, 'open').toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
				output.should.contain('12/13');
			});
			
			it('Should reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 3, 'open').toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.contain('1/4');
			});
			
			it('Should reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5, 'open').toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.contain('1/4');
			});
		});
	});
});


describe('View', () => {

	let sandbox, postShim, readFileShim, fakeCommand;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		postShim = {
			reply: sandbox.stub().resolves()
		};
		
		fakeCommand = {
			reply: sandbox.stub().resolves(),
			getPost: () => Promise.resolve(postShim)
		};
		
		readFileShim = sandbox.stub().resolves(new Buffer('read file'));

		view.activate({Post: postShim, Format: undefined, supports: () => false}, readFileShim);
	});
	
	afterEach(() => {
		sandbox.restore();
	});

	it('should wrap command.reply as respond', () => {
		return view.respond(fakeCommand, 'This is a reply').then(() => {
			fakeCommand.reply.calledWith('This is a reply').should.be.true;
		});
	});

	it('should wrap post.reply as respondInThread', () => {
		return view.respondInThread(123, 'This is a reply').then(() => {
			postShim.reply.calledWith(123, undefined, 'This is a reply').should.be.true;
		});
	});

	it('should wrap command.reply as reportError', () => {
		return view.reportError(fakeCommand, 'ERR: ', 'This is an error').then(() => {
			fakeCommand.reply.calledWith('ERR: This is an error').should.be.true;
		});
	});

	it('should reply with Handlebars', () => {
		const data = {123: 435};
		const fakeTemplate = sandbox.stub().returns('a compiled string');
		view.activate({
			supports: () => true
		}, readFileShim);
		
		sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
		return view.respondWithTemplate('foo.hbrs', data, fakeCommand).then(() => {
			Handlebars.compile.calledWith('read file').should.equal(true);
			fakeTemplate.calledWith(data).should.equal(true);
			fakeCommand.reply.calledWith('a compiled string').should.equal(true);
		});
	});
	
	it('should reply with Handlebars in split-lines mode', () => {
		const data = {123: 435};
		const fakeTemplate = sandbox.stub().returns('a compiled string\nwith two lines');
		view.activate({
			supports: () => false
		}, readFileShim);

		sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
		return view.respondWithTemplate('foo.hbrs', data, fakeCommand).then(() => {
			Handlebars.compile.calledWith('read file').should.equal(true);
			fakeTemplate.calledWith(data).should.equal(true);
			postShim.reply.should.be.calledTwice;
			postShim.reply.should.be.calledWith('a compiled string');
			postShim.reply.should.be.calledWith('with two lines');
		});
	});
});
