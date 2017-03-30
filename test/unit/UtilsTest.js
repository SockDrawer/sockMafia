'use strict';
/*globals describe, it*/

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const Utils = require('../../src/utils');

describe('Utils helpers', () => {
    describe('argParse()', () => {
        let input = null;
        beforeEach(() => {
            input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
        });
        it('should return full input for end token not found', () => {
            const expected = 'a b c d e f g h i j k l m';
            Utils.argParse(input, ['q']).should.equal(expected);
        });
        it('should remove matched args from input', () => {
            const expected = ['g', 'h', 'i', 'j', 'k', 'l', 'm'];
            Utils.argParse(input, ['f']);
            input.should.eql(expected);
        });
    });

    describe('isNumeric()', () => {
        it('Should return true for 123', () => {
            Utils.isNumeric(123).should.be.true;
        });
        it('Should return true for "123"', () => {
            Utils.isNumeric('123').should.be.true;
        });
        it('Should return false for "banana"', () => {
            Utils.isNumeric('banana').should.be.false;
        });
        it('Should return false for "123abc"', () => {
            Utils.isNumeric('123abc').should.be.false;
        });
        it('Should return false for "abc123"', () => {
            Utils.isNumeric('abc123').should.be.false;
        });
    });
});
