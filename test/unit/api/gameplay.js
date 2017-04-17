'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
    MafiaUser = require('../../../src/dao/mafiaUser'),
    gameplayApi = require('../../../src/api/gameplay'),
    utilsApi = require('../../../src/api/utils');

describe('api/gameplay', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            gameplayApi.should.have.keys(['bindForum']);
            gameplayApi.bindForum.should.be.a.function;
        });
    });
    describe('GamePlay', () => {
        let GamePlay, forum, dao, sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
            dao = new Dao(':memory:');
            GamePlay = gameplayApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('killPlayer', () => {
            let user, game, stubGetGameForModActivity, stubGetUser, stubKillPlayer;
            beforeEach(() => {
                user = new MafiaUser({
                    username: `player${Math.random()}`
                });
                game = new MafiaGame({
                    id: 42,
                    isActive: true
                }, {});
                stubKillPlayer = sandbox.stub(game, 'killPlayer').resolves();
                stubGetUser = sandbox.stub(utilsApi, 'getUser').rejects(new Error('TOO_MANY_TEST_CALLS'));
                stubGetUser.onFirstCall().resolves(user);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(game);
            });
            it('should get game via getGameForModActivity Utility', () => {
                const expectedid = `id${Math.random()}`;
                const expectedname = `name${Math.random()}`;
                return GamePlay.killPlayer(expectedid, expectedname, 'user').then(() => {
                    stubGetGameForModActivity.calledWith(expectedid, expectedname, dao, forum).should.be.true;
                });
            });
            it('should retrieve player via GetUser utility', () => {
                const expected = `player${Math.random()}`;
                return GamePlay.killPlayer('foo', 'mod', expected).then(() => {
                    stubGetUser.calledWith(expected);
                });
            });
            it('should reject if target is not alive', () => {
                user._data.isAlive = false;
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith('E_PLAYER_NOT_ALIVE');
            });
            it('should kill retrieved player', () => {
                return GamePlay.killPlayer('id', 'mod', 'user').then(() => {
                    stubKillPlayer.calledWith(user).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return GamePlay.killPlayer('id', 'mod', 'user').should.become(undefined);
            });
            it('should reject when game retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetGameForModActivity.rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when user retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetUser.onFirstCall().rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when kill fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubKillPlayer.rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
        });
        describe('unkillPlayer', () => {
            let user, game, stubGetGameForModActivity, stubGetUser, stubResurectPlayer;
            beforeEach(() => {
                user = new MafiaUser({
                    username: `player${Math.random()}`,
                    isAlive: false
                });
                game = new MafiaGame({
                    id: 42,
                    isActive: true
                }, {});
                stubResurectPlayer = sandbox.stub(game, 'resurectPlayer').resolves();
                stubGetUser = sandbox.stub(utilsApi, 'getUser').rejects(new Error('TOO_MANY_TEST_CALLS'));
                stubGetUser.onFirstCall().resolves(user);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(game);
            });
            it('should get game via getGameForModActivity Utility', () => {
                const expectedId = `id${Math.random()}`;
                const expectedName = `name${Math.random()}`;
                return GamePlay.unkillPlayer(expectedId, expectedName, 'user').then(() => {
                    stubGetGameForModActivity.calledWith(expectedId, expectedName, dao, forum).should.be.true;
                });
            });
            it('should retrieve player via getUser utility', () => {
                const expected = `player${Math.random()}`;
                return GamePlay.unkillPlayer('foo', 'mod', expected).then(() => {
                    stubGetUser.calledWith(expected);
                });
            });
            it('should reject if target is alive', () => {
                user._data.isAlive = true;
                return GamePlay.unkillPlayer('id', 'mod', 'user').should.be.rejectedWith('E_PLAYER_NOT_DEAD');
            });
            it('should unkill retrieved player', () => {
                return GamePlay.unkillPlayer('id', 'mod', 'user').then(() => {
                    stubResurectPlayer.calledWith(user).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return GamePlay.unkillPlayer('id', 'mod', 'user').should.become(undefined);
            });
            it('should reject when game retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetGameForModActivity.rejects(err);
                return GamePlay.unkillPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when user retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetUser.onFirstCall().rejects(err);
                return GamePlay.unkillPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when kill fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubResurectPlayer.rejects(err);
                return GamePlay.unkillPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
        });
        describe('advancePhase()', () => {
            let game, stubGetGameForModActivity, stubNextPhase;
            beforeEach(() => {
                game = new MafiaGame({
                    id: 42,
                    isActive: true
                }, {});
                stubNextPhase = sandbox.stub(game, 'nextPhase').resolves();
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(game);
            });
            it('should get game via getGameForModActivity Utility', () => {
                const expectedId = `id${Math.random()}`;
                const expectedName = `name${Math.random()}`;
                return GamePlay.advancePhase(expectedId, expectedName).then(() => {
                    stubGetGameForModActivity.calledWith(expectedId, expectedName, dao, forum).should.be.true;
                });
            });
            it('should reject when getGameForModActivity rejects', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetGameForModActivity.rejects(err);
                return GamePlay.advancePhase('id', 'mod').should.be.rejectedWith(err);
            });
            it('should resolve to undefined', () => {
                return GamePlay.advancePhase('id', 'mod').should.become(undefined);
            });
            it('should advance a single phase when no stage is provided', () => {
                return GamePlay.advancePhase('foo', 'mod', undefined).then(() => {
                    stubNextPhase.callCount.should.equal(1);
                });
            });
            it('should advance multiple phases when phase is provided', () => {
                game._data.phases = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
                game._data.phase = 'one';
                const expected = Math.floor(Math.random() * 7) + 3;
                stubNextPhase.onCall(expected).callsFake(() => {
                    game._data.phase = 'nine';
                    return Promise.resolve();
                });
                return GamePlay.advancePhase('foo', 'mod', 'nine').then(() => {
                    stubNextPhase.callCount.should.equal(expected + 1);
                });
            });
            it('should advance multiple phases when start phase is target phase', () => {
                game._data.phases = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
                game._data.phase = 'one';
                const expected = Math.floor(Math.random() * 7) + 3;
                stubNextPhase.onCall(expected).callsFake(() => {
                    game._data.phase = 'nine';
                    return Promise.resolve();
                });
                return GamePlay.advancePhase('foo', 'mod', 'nine').then(() => {
                    stubNextPhase.callCount.should.equal(expected + 1);
                });
            });
            it('should reject when target phase is not a valid phase', () => {
                game._data.phases = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
                return GamePlay.advancePhase('foo', 'mod', 'eleven').should.be.rejectedWith('E_INVALID_TARGET_STAGE');
            });
        });
        describe('advancePhase()', () => {
            let game, stubGetGameForModActivity, stubNewDay;
            beforeEach(() => {
                game = new MafiaGame({
                    id: 42,
                    isActive: true
                }, {});
                stubNewDay = sandbox.stub(game, 'newDay').resolves();
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(game);
            });
            it('should get game via getGameForModActivity Utility', () => {
                const expectedId = `id${Math.random()}`;
                const expectedName = `name${Math.random()}`;
                return GamePlay.advanceDay(expectedId, expectedName).then(() => {
                    stubGetGameForModActivity.calledWith(expectedId, expectedName, dao, forum).should.be.true;
                });
            });
            it('should reject when getGameForModActivity rejects', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetGameForModActivity.rejects(err);
                return GamePlay.advanceDay('id', 'mod').should.be.rejectedWith(err);
            });
            it('should resolve to undefined', () => {
                return GamePlay.advanceDay('id', 'mod').should.become(undefined);
            });
            it('should advance day via game.newDay()', () => {
                return GamePlay.advanceDay('id', 'mod').then(() => {
                    stubNewDay.callCount.should.equal(1);
                });
            });
            it('should reject when game.newDay rejects', () => {
                const err = new Error(`oops${Math.random()}`);
                stubNewDay.rejects(err);
                return GamePlay.advanceDay('id', 'mod').should.be.rejectedWith(err);
            });
        });
    });
});
