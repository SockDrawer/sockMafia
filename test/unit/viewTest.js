'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const view = require('../../src/view');
const listNamesHelper = require('../../src/templates/helpers/listNames');
const voteChartHelper = require('../../src/templates/helpers/voteChart');
const mafia = require('../../src/mafiabot');

const Handlebars = require('handlebars');

describe('View helpers', () => {

	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mafia.internals.configuration = mafia.defaultConfig;
	});
	
	afterEach(() => {
		sandbox.restore();
	});

	describe('listNames()', () => {
		beforeEach(() => {
			sandbox.stub(Math, 'random').returns(0);
		});
	
		it('Should one player without a comma', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue'
			}];
			const output = listNamesHelper(input).toString();
			output.should.contain('yamikuronue');
			output.should.not.contain(',');
		});
		
		it('Should link to the post', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue'
			}];
			listNamesHelper(input).toString().should.contain('/topic/123/slug/43');
		});
		
		it('Should bold current posts', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue'
			}];
			listNamesHelper(input).toString().should.contain('<b>');
			listNamesHelper(input).toString().should.contain('</b>');
		});
		
		it('Should strikeout retracted posts', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue',
				retracted: true,
				retractedAt: 44
			}];
			listNamesHelper(input).toString().should.contain('<s>');
			listNamesHelper(input).toString().should.contain('</s>');
		});
		
		it('Should link to the retraction', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue',
				retracted: true,
				retractedAt: 44
			}];
			listNamesHelper(input).toString().should.contain('/topic/123/slug/44');
		});

		it('Should list two votes with a comma', () => {
			const input = [{
				game: 123,
				post: 43,
				voter: 'yamikuronue'
			},
			{
				game: 123,
				post: 47,
				voter: 'accalia'
			}];
			listNamesHelper(input).toString().should.contain('/topic/123/slug/43');
			listNamesHelper(input).toString().should.contain('/topic/123/slug/47');
			listNamesHelper(input).toString().should.contain(',');
			listNamesHelper(input).toString().should.contain('yamikuronue');
			listNamesHelper(input).toString().should.contain('accalia');
		});
	});
	
	describe('voteChart()', () => {

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
			before(() => {
				mafia.internals.configuration.voteBars = 'bastard';
			});

			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12).toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
			});
			
			it('Should fill hammer when loved is dead', () => {
				const output = decode(voteChartHelper(12, +1, 12).toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 3).toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
			});
			
			it('Should reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5).toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
			});
		});


		describe('hidden bars', () => {
			before(() => {
				mafia.internals.configuration.voteBars = 'hidden';
			});


			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12).toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
			});

			it('Should fill hammer when loved is in normal hammer', () => {
				const output = decode(voteChartHelper(11, +1, 12).toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should fill hammer when loved would be dead', () => {
				const output = decode(voteChartHelper(12, +1, 12).toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
			});
			
			it('Should not reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 4).toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.not.contain('1/4');
			});
			
			it('Should not reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5).toString());
				output.should.contain('<rect x="80%" width="20" height="100%"');
				output.should.not.contain('1/4');
			});
		});

		describe('open bars', () => {
			before(() => {
				mafia.internals.configuration.voteBars = 'open';
			});

			it('Should show dead when hated is in hammer', () => {
				const output = decode(voteChartHelper(11, -1, 12).toString());
				output.should.contain('fill="' + colors.DARK_RED);
				output.should.contain('fill="' + colors.RED);
				output.should.contain('11/11');
			});
			
			it('Should fill hammer when loved is dead', () => {
				const output = decode(voteChartHelper(12, +1, 12).toString());
				output.should.contain('fill="' + colors.GREEN);
				output.should.contain('fill="' + colors.LIGHT_GREEN);
				output.should.contain('12/13');
			});
			
			it('Should reveal loved', () => {
				const output = decode(voteChartHelper(1, +1, 3).toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.contain('1/4');
			});
			
			it('Should reveal hated', () => {
				const output = decode(voteChartHelper(1, -1, 5).toString());
				output.should.contain('<rect x="75%" width="25" height="100%"');
				output.should.contain('1/4');
			});
		});
	});
});


describe('View', () => {

	let sandbox, postShim, readFileShim;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		postShim = {
			reply: sandbox.stub().resolves()
		};
		readFileShim = sandbox.stub().resolves(new Buffer('read file'));

		view.init(postShim, readFileShim);
	});
	
	afterEach(() => {
		sandbox.restore();
	});

	it('should wrap post.reply as respond', () => {
		return view.respond({
			post: {
				topic_id: 123,
				post_number: 345
			}
		}, 'This is a reply').then(() => {
			postShim.reply.calledWith(123, 345, 'This is a reply').should.equal(true);
		});
	});

	it('should wrap post.reply as respondInThread', () => {
		return view.respondInThread(123, 'This is a reply').then(() => {
			postShim.reply.calledWith(123, undefined, 'This is a reply').should.equal(true);
		});
	});

	it('should wrap post.reply as reportError', () => {
		return view.reportError({
			post: {
				topic_id: 123,
				post_number: 345
			}
		}, 'ERR: ', 'This is an error').then(() => {
			postShim.reply.calledWith(123, 345, 'ERR: This is an error').should.equal(true);
		});
	});

	it('should reply with Handlebars', () => {
		const data = {123: 435};
		const fakeTemplate = sandbox.stub().returns('a compiled string');

		sandbox.stub(Handlebars, 'compile').returns(fakeTemplate);
		return view.respondWithTemplate('foo.hbrs', data, {
			post: {
				topic_id: 123,
				post_number: 345
			}
		}).then(() => {
			Handlebars.compile.calledWith('read file').should.equal(true);
			fakeTemplate.calledWith(data).should.equal(true);
			postShim.reply.calledWith(123, 345, 'a compiled string').should.equal(true);
		});
	});
});
