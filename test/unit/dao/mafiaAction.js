'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
chai.use(require('chai-as-promised'));

chai.should();

const MafiaAction = require('../../src/dao/mafiaAction');

describe('nouveau dao/MafiaAction', () => {
    it('should export a function', () => {
        MafiaAction.should.be.a('function');
    });
    it('should be a constructor', () => {
        const obj = new MafiaAction({});
        obj.should.be.an.instanceOf(MafiaAction);
    });
    describe('ctor()', () => {
        it('should store data', () => {
            const obj = {};
            const user = new MafiaAction(obj);
            user._data.should.equal(obj);
        });
        it('should store game', () => {
            const obj = {};
            const user = new MafiaAction({}, obj);
            user._game.should.equal(obj);
        });
        it('should preserve action', () => {
            const user = new MafiaAction({
                action: 'foobar'
            });
            user._data.action.should.equal('foobar');
        });
        it('should default action to `vote`', () => {
            const user = new MafiaAction({});
            user._data.action.should.equal('vote');
        });
        it('should preserve token', () => {
            const user = new MafiaAction({
                token: 'foobar'
            });
            user._data.token.should.equal('foobar');
        });
        it('should default token to `vote`', () => {
            const user = new MafiaAction({});
            user._data.token.should.equal('vote');
        });
    });
    describe('simple getters', () => {
        let user = null;
        beforeEach(() => user = new MafiaAction({}));
        ['postId', 'action', 'token', 'revokedId'].forEach((getter) => {
            it(`should have a simple getter for ${getter}`, () => {
                const expected = Math.random();
                user._data[getter] = expected;
                user[getter].should.equal(expected);
            });
        });
    });
    describe('getter isCurrent', () => {
        it('should be true when action is not revoked', () => {
            const action = new MafiaAction({
                revokedId: undefined
            });
            action.isCurrent.should.be.true;
        });
        it('should be false when action is revoked', () => {
            const action = new MafiaAction({
                revokedId: 532
            });
            action.isCurrent.should.be.false;
        });
    });
    describe('getter actor', () => {
        let game = null,
            action = null;
        beforeEach(() => {
            game = {
                _getPlayer: sinon.stub().returns(null)
            };
            action = new MafiaAction({}, game);
        });
        it('should get user via game._getPlayer()', () => {
            const user = {};
            game._getPlayer.returns(user);
            action.actor.should.equal(user);
        });
        it('should accept null user', () => {
            const actor = action.actor;
            chai.expect(actor).to.be.null;
        });
        it('should get user via game._getPlayer()', () => {
            const name = `name${Math.random()}`;
            action._data.actor = name;
            const actor = action.actor;
            game._getPlayer.calledWith(name).should.be.true;
        });
    });
    describe('getter target', () => {
        let game = null,
            action = null;
        beforeEach(() => {
            game = {
                _getPlayer: sinon.stub().returns(null)
            };
            action = new MafiaAction({}, game);
        });
        it('should get user via game._getPlayer()', () => {
            const user = {};
            game._getPlayer.returns(user);
            action.target.should.equal(user);
        });
        it('should accept null user', () => {
            const actor = action.target;
            chai.expect(actor).to.be.null;
        });
        it('should get user via game._getPlayer()', () => {
            const name = `name${Math.random()}`;
            action._data.target = name;
            const actor = action.target;
            game._getPlayer.calledWith(name).should.be.true;
        });
    });
    describe('revoke()', () => {
        let game = null,
            action = null;
        beforeEach(() => {
            game = {
                save: sinon.stub().resolves()
            };
            action = new MafiaAction({}, game);
        });
        it('should store revocation id', () => {
            const id = Math.random();
            return action.revoke(id).then(() => {
                action._data.revokedId.should.equal(id);
            });
        });
        it('should resolve to revoked action', () => {
            return action.revoke(4).should.become(action);
        });
        it('should save after revoking', () => {
            return action.revoke('foo').then(() => {
                game.save.called.should.be.true;
            });
        });
    });
});
