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
    describe('extractUsername()', () => {
        let forum;
        beforeEach(() => {
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
        });
        it('should retrieve player from string', () => {
            const name = `name${Math.random()}`;
            return utilsApi.extractUsername(name, forum).should.become(name);
        });
        it('should retrieve player from forum.User', () => {
            const name = `name${Math.random()}`;
            return utilsApi.extractUsername(new forum.User(name), forum).should.become(name);
        });
        it('should reject for zero length string', () => {
            return utilsApi.extractUsername('', forum).should.be.rejectedWith('E_INVALID_USER');
        });
        it('should reject for "duck-typed" user', () => {
            return utilsApi.extractUsername({
                username: 'name'
            }, forum).should.be.rejectedWith('E_INVALID_USER');
        });
        it('should reject for random typed parameter', () => {
            return utilsApi.extractUsername(Math.random(), forum).should.be.rejectedWith('E_INVALID_USER');
        });
    });
    describe('getUser()', () => {
        let forum, game, sandbox, stubExtractUsername, stubGetPlayer, player;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
            game = new MafiaGame({}, {});
            player = new MafiaUser({}, {});
            stubGetPlayer = sinon.stub(game, 'getPlayer').resolves(player);
            stubExtractUsername = sandbox.stub(utilsApi, 'extractUsername').resolves();
        });
        afterEach(() => sandbox.restore());
        it('should retrieve player username via extractUsername()', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getUser(name, game, forum).then(() => {
                stubExtractUsername.calledWith(name).should.be.true;
            });
        });
        it('should retrieve player from game based on results of extractUsername()', () => {
            const id = `name${Math.random()}`;
            const name = `name${Math.random()}`;
            stubExtractUsername.resolves(id);
            return utilsApi.getUser(name, game, forum).then(() => {
                stubGetPlayer.calledWith(id).should.be.true;
            });
        });
        it('should resolve to results of getPlayer()', () => {
            const name = new MafiaUser({
                username: `name${Math.random()}`
            }, {});
            stubGetPlayer.resolves(name);
            return utilsApi.getUser(name, game, forum).should.become(name);
        });
        it('should reject when getPlayer rejects by string', () => {
            const err = new Error(`name${Math.random()}`);
            stubGetPlayer.rejects(err);
            return utilsApi.getUser('name', game, forum).should.be.rejectedWith(err);
        });
    });
});
