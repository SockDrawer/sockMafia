'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
    MafiaUser = require('../../../src/dao/mafiaUser'),
    utilsApi = require('../../../src/api/utils');

describe('api/gameplay', () => {
    describe('module', () => {
        ['getGame', 'getUser'].forEach((fn) => {
            it(`should expose a '${fn}()' function`, () => {
                utilsApi.should.have.any.keys([fn]);
                utilsApi[fn].should.be.a.function;
            });
        });
    });
    describe('getGame()', () => {
        let dao, game, stubGetGameById;
        beforeEach(() => {
            dao = new Dao(':memory:');
            game = new MafiaGame({}, {});
            stubGetGameById = sinon.stub(dao, 'getGameById').resolves(game);
        });
        it('should require `gameId`', () => {
            return utilsApi.getGame('', dao).should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
        });
        it('should retrieve game by id', () => {
            const id = `id${Math.random()}`;
            return utilsApi.getGame(id, dao).then(() => {
                stubGetGameById.calledWith(id).should.be.true;
            });
        });
        it('should resolve to retrieved game', () => {
            return utilsApi.getGame('id', dao).should.become(game);
        });
        it('should reject if dao rejects', () => {
            const err = new Error(`ERROR${Math.random()}`);
            stubGetGameById.rejects(err);
            return utilsApi.getGame('id', dao).should.be.rejectedWith(err);
        });
    });
    describe('getUser()', () => {
        let forum, game, stubGetPlayer, player;
        beforeEach(() => {
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
            game = new MafiaGame({}, {});
            player = new MafiaUser({}, {});
            stubGetPlayer = sinon.stub(game, 'getPlayer').resolves(player);
        });
        it('should retrieve player by string', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getUser(name, game, forum).then(() => {
                stubGetPlayer.calledWith(name).should.be.true;
            });
        });
        it('should resolve to retrieved player by string', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getUser(name, game, forum).should.become(player);
        });
        it('should reject when getPlayer rejects by string', () => {
            const err = new Error(`name${Math.random()}`);
            stubGetPlayer.rejects(err);
            return utilsApi.getUser('name', game, forum).should.be.rejectedWith(err);
        });
        it('should retrieve player by forum.User', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getUser(new forum.User(name), game, forum).then(() => {
                stubGetPlayer.calledWith(name).should.be.true;
            });
        });
        it('should resolve to retrieved player by forum.User', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getUser(new forum.User(name), game, forum).should.become(player);
        });
        it('should reject when getPlayer rejects by forum.User', () => {
            const err = new Error(`name${Math.random()}`);
            stubGetPlayer.rejects(err);
            return utilsApi.getUser(new forum.User('name'), game, forum).should.be.rejectedWith(err);
        });
        it('should reject for zero length string', () => {
            return utilsApi.getUser('', game, forum).should.be.rejectedWith('E_INVALID_USER');
        });
        it('should reject for "duck-typed" user', () => {
            return utilsApi.getUser({
                username: 'name'
            }, game, forum).should.be.rejectedWith('E_INVALID_USER');
        });
        it('should reject for random typed parameter', () => {
            return utilsApi.getUser(Math.random(), game, forum).should.be.rejectedWith('E_INVALID_USER');
        });
    });
});
