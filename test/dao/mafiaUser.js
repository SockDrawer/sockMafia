'use strict';

const chai = require('chai'),
    sinon = require('sinon'),
    string = require('string');

//promise library plugins
require('sinon-as-promised');
chai.use(require('chai-as-promised'));

chai.should();

const MafiaUser = require('../../src/dao/mafiaUser');

describe('nouveau dao/MafiaGame', () => {
    it('should export a function', () => {
        MafiaUser.should.be.a('function');
    });
    it('should be a constructor', () => {
        const obj = new MafiaUser({});
        obj.should.be.an.instanceOf(MafiaUser);
    });
    describe('ctor()', () => {
        it('should store data', () => {
            const obj = {};
            const user = new MafiaUser(obj);
            user._data.should.equal(obj);
        });
        it('should store game', () => {
            const obj = {};
            const user = new MafiaUser({}, obj);
            user._game.should.equal(obj);
        });
    });
    describe('simple getters', () => {
        let user = null;
        beforeEach(() => user = new MafiaUser({}));
        ['username', 'userslug', 'isAlive', 'isModerator'].forEach((getter) => {
            it(`should have a simple getter for ${getter}`, () => {
                const expected = Math.random();
                user._data[getter] = expected;
                user[getter].should.equal(expected);
            });
        });
    });
    describe('toJSON()',()=>{
        it('should return inner data',()=>{
            const obj = {};
            const user = new MafiaUser(obj);
            user.toJSON().should.equal(obj);
        });
    });
    describe('getProperties()',()=>{
        let user = null;
        const properties = ['strawberry', 'chocolate','vanilla','wasabi'];
        beforeEach(()=> user = new MafiaUser({properties:properties})        );
        it('should return unfiltered properties',()=>{
            const props = user.getProperties();
            props.should.eql(properties);
            props.should.not.equal(properties);
        });
    });
});
