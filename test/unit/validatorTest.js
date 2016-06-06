'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const validator = require('../../src/validator');

describe('Validation helpers', () => {

	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('mustBeTrue', () => {
		it('Should resolve when the answer is true', () => {
			const check = sandbox.stub().resolves(true);
			return validator.mustBeTrue(check, [], 'Error').should.not.be.rejected;
		});

		it('Should reject when the answer is false', () => {
			const check = sandbox.stub().resolves(false);
			return validator.mustBeTrue(check, [], 'Error').should.be.rejectedWith('Error');
		});
	});

	describe('mustBeFalse', () => {
		it('Should resolve when the answer is false', () => {
			const check = sandbox.stub().resolves(false);
			return validator.mustBeFalse(check, [], 'Error').should.not.be.rejected;
		});

		it('Should reject when the answer is true', () => {
			const check = sandbox.stub().resolves(true);
			return validator.mustBeFalse(check, [], 'Error').should.be.rejectedWith('Error');
		});
	});

});
