'use strict';
/*globals describe, it*/

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
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
});
