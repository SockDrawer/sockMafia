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
            let mod, user, game, stubGetGame, stubGetUser, stubKillPlayer;
            beforeEach(() => {
                mod = new MafiaUser({
                    username: `moderator${Math.random()}`,
                    isModerator: true
                });
                user = new MafiaUser({
                    username: `player${Math.random()}`
                });
                game = new MafiaGame({
                    id: 42,
                    isActive: true
                }, {});
                stubKillPlayer = sandbox.stub(game, 'killPlayer').resolves();
                stubGetUser = sandbox.stub(utilsApi, 'getUser').rejects(new Error('TOO_MANY_TEST_CALLS'));
                stubGetUser.onFirstCall().resolves(mod);
                stubGetUser.onSecondCall().resolves(user);
                stubGetGame = sandbox.stub(utilsApi, 'getGame').resolves(game);
            });
            it('should get game via getGame Utility', () => {
                const expected = `id${Math.random()}`;
                return GamePlay.killPlayer(expected, 'mod', 'user').then(() => {
                    stubGetGame.calledWith(expected, dao).should.be.true;
                });
            });
            it('should reject for inactive game', () => {
                game._data.isActive = false;
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith('E_GAME_NOT_ACTIVE');
            });
            it('should retrieve Moderator first', () => {
                const expected = `mod${Math.random()}`;
                return GamePlay.killPlayer('foo', expected, 'user').then(() => {
                    stubGetUser.firstCall.calledWith(expected);
                });
            });
            it('should reject if moderator is not a moderator', () => {
                mod._data.isModerator = false;
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith('E_ACTOR_NOT_MODERATOR');
            });
            it('should retrieve player second', () => {
                const expected = `player${Math.random()}`;
                return GamePlay.killPlayer('foo', 'mod', expected).then(() => {
                    stubGetUser.secondCall.calledWith(expected);
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
                stubGetGame.rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when moderator retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetUser.onFirstCall().rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when user retrieval fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubGetUser.onSecondCall().rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
            it('should reject when kill fails', () => {
                const err = new Error(`err${Math.random()}`);
                stubKillPlayer.rejects(err);
                return GamePlay.killPlayer('id', 'mod', 'user').should.be.rejectedWith(err);
            });
        });
    });
});
