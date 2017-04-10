'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const MafiaUser = require('../../../src/dao/mafiaUser');

describe('nouveau dao/MafiaUser', () => {
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
        it('should slugify username', () => {
            const user = new MafiaUser({
                username: 'FOO BAR',
                userslug: 'FOO BAR'
            });
            user._data.userslug.should.equal('foo-bar');
        });
        it('should preserve isAlive as `true`', () => {
            const user = new MafiaUser({
                isAlive: true
            });
            user._data.isAlive.should.equal(true);
        });
        it('should preserve isAlive as `false`', () => {
            const user = new MafiaUser({
                isAlive: false
            });
            user._data.isAlive.should.equal(false);
        });
        it('should default isAlive to `true`', () => {
            const user = new MafiaUser({});
            user._data.isAlive.should.equal(true);
        });
        it('should preserve isModerator as `true`', () => {
            const user = new MafiaUser({
                isModerator: true
            });
            user._data.isModerator.should.equal(true);
        });
        it('should preserve isModerator as `false`', () => {
            const user = new MafiaUser({
                isModerator: false
            });
            user._data.isModerator.should.equal(false);
        });
        it('should default isModerator to `false`', () => {
            const user = new MafiaUser({});
            user._data.isModerator.should.equal(false);
        });
        it('should preserve properties', () => {
            const props = ['foo', 'bar'];
            const user = new MafiaUser({
                properties: props
            });
            user._data.properties.should.equal(props);
        });
        it('should default properties to empty array', () => {
            const user = new MafiaUser({});
            user._data.properties.should.eql([]);
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
    describe('getter values', () => {
        let user = null;
        beforeEach(() => user = new MafiaUser({}));
        it('should return an object', () => {
            user.values.should.be.an('object');
        });
        it('should return values as set', () => {
            const expected = {};
            for (let i = 0; i < 50; i += 1) {
                expected[`key ${Math.random()}`] = Math.random();
            }
            user._data.values = expected;
            user.values.should.deep.equal(expected);
        });
        it('should return copy of values', () => {
            const expected = {};
            for (let i = 0; i < 50; i += 1) {
                expected[`key ${Math.random()}`] = Math.random();
            }
            user._data.values = expected;
            user.values.should.not.equal(expected);
        });
    });
    describe('toJSON()', () => {
        it('should return inner data', () => {
            const obj = {};
            const user = new MafiaUser(obj);
            user.toJSON().should.equal(obj);
        });
    });
    describe('getProperties()', () => {
        let user = null;
        const properties = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
        beforeEach(() => user = new MafiaUser({
            properties: properties
        }));
        it('should return unfiltered properties', () => {
            const props = user.getProperties();
            props.should.eql(properties);
            props.should.not.equal(properties);
        });
        it('should filter properties', () => {
            const filter = ['vanilla'];
            user.getProperties(filter).should.eql(filter);
        });
        it('should only return matching filterd properties', () => {
            const filter = ['vanilla', 'orange'];
            const expected = ['vanilla'];
            user.getProperties(filter).should.eql(expected);
        });
        it('should return empty array for no matching properties', () => {
            const filter = ['orange', 'pear'];
            const expected = [];
            user.getProperties(filter).should.eql(expected);
        });
    });
    describe('hasProperty()', () => {
        let user = null;
        const properties = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
        beforeEach(() => user = new MafiaUser({
            properties: properties
        }));
        it('should return true for matching property', () => {
            user.hasProperty('strawberry').should.be.true;
        });
        it('should return false for non-matching property', () => {
            user.hasProperty('Strawberry').should.be.false;
        });
        it('should return false for matching property', () => {
            user._data.properties = [];
            user.hasProperty('strawberry').should.be.false;
        });
    });
    describe('addProperty()', () => {
        let user = null,
            game = null,
            properties = null;
        const allProps = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
        beforeEach(() => {
            properties = allProps.slice();
            game = {
                save: sinon.stub().resolves()
            };
            user = new MafiaUser({
                properties: properties
            }, game);
        });
        it('should resolve true when property added', () => {
            return user.addProperty('orange').should.become(true);
        });
        it('should save when property added', () => {
            return user.addProperty('orange').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should add property to property list when property added', () => {
            const expected = ['strawberry', 'chocolate', 'vanilla', 'wasabi', 'orange'];
            return user.addProperty('orange').then(() => {
                user._data.properties.should.eql(expected);
            });
        });
        it('should resolve false when property already existed', () => {
            return user.addProperty('wasabi').should.become(false);
        });
        it('should not save when property aready existed', () => {
            return user.addProperty('wasabi').then(() => {
                game.save.called.should.be.false;
            });
        });
        it('should not add property to property list when property existed', () => {
            const expected = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
            return user.addProperty('wasabi').then(() => {
                user._data.properties.should.eql(expected);
            });
        });
    });
    describe('removeProperty()', () => {
        let user = null,
            game = null,
            properties = null;
        const allProps = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
        beforeEach(() => {
            properties = allProps.slice();
            game = {
                save: sinon.stub().resolves()
            };
            user = new MafiaUser({
                properties: properties
            }, game);
        });
        it('should resolve true when property removed', () => {
            return user.removeProperty('wasabi').should.become(true);
        });
        it('should save when property removed', () => {
            return user.removeProperty('wasabi').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should remove property from property list when property removed', () => {
            const expected = ['strawberry', 'chocolate', 'vanilla'];
            return user.removeProperty('wasabi').then(() => {
                user._data.properties.should.eql(expected);
            });
        });
        it('should resolve false when property did not already exist', () => {
            return user.removeProperty('orange').should.become(false);
        });
        it('should save when property did not aready exist', () => {
            return user.removeProperty('orange').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should not remove property from property list when property did not exist', () => {
            const expected = ['strawberry', 'chocolate', 'vanilla', 'wasabi'];
            return user.removeProperty('orange').then(() => {
                user._data.properties.should.eql(expected);
            });
        });
    });
    describe('getValue()', () => {
        let user = null,
            values = null;
        beforeEach(() => {
            user = new MafiaUser({});
            user.save = sinon.stub().resolves(user);
            values = user._data.values;
        });
        it('should return undefined for unknown key', () => {
            const name = `keykey${Math.random()}`;
            values.should.not.have.any.key(name);
            chai.expect(user.getValue(name)).to.be.undefined;
        });
        it('should return saved value for key', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            values[name] = expected;
            user.getValue(name).should.equal(expected);
        });
    });
    describe('setValue()', () => {
        let user = null,
            values = null;
        beforeEach(() => {
            user = new MafiaUser({});
            user.save = sinon.stub().resolves(user);
            values = user._data.values;
        });
        it('should set value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            return user.setValue(name, expected).then(() => {
                values[name].should.equal(expected);
            });
        });
        it('should save new value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            return user.setValue(name, expected).then(() => {
                user.save.called.should.be.true;
            });
        });
        it('should resolve to overridden value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            values[name] = expected;
            return user.setValue(name, 'foobar').then((oldvalue) => {
                oldvalue.should.equal(expected);
            });
        });
    });
});
