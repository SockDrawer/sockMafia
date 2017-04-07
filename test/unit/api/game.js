'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    gameApi = require('../../../src/api/game');

describe('api/query', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            gameApi.should.have.keys(['bindForum']);
            gameApi.bindForum.should.be.a.function;
        });
    });
    describe('Game', () => {
        let sandbox, Game, forum, dao;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {};

            dao = new Dao(':memory:');
            Game = gameApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('createGame()', () => {
            let stubAddGame, gameId;
            beforeEach(() => {
                forum.Topic = function(id) {
                    this.id = id;
                };
                gameId = Math.floor(Math.random() * 1e5) + 1;
                stubAddGame = sinon.stub(dao, 'addGame').resolves({
                    id: gameId
                });
            });
            it('should pass data to dao.addGame()', () => {
                const data = {
                    name: `foobar${Math.random()}`,
                    topic: new forum.Topic(Math.random())
                };
                return Game.createGame(data).then(() => {
                    stubAddGame.calledWith(data).should.be.true;
                });
            });
            it('should resolve to created game Id', () => {
                const data = {
                    name: `foobar${Math.random()}`,
                    topic: new forum.Topic(Math.random())
                };
                return Game.createGame(data).should.become(gameId);
            });
            it('should accept a numberic id as gameData.topic', () => {
                const data = {
                    name: 'name',
                    topic: Math.random()
                };
                return Game.createGame(data).should.become(gameId);
            });
            it('should reject with no gameData', () => {
                return Game.createGame(undefined).should.be.rejectedWith('E_INVALID_GAME_DATA');
            });
            it('should reject with null gameData', () => {
                return Game.createGame(null).should.be.rejectedWith('E_INVALID_GAME_DATA');
            });
            it('should reject with non string gameData.name', () => {
                const data = {
                    name: 4,
                    topic: new forum.Topic(Math.random())
                };
                return Game.createGame(data).should.be.rejectedWith('E_INVALID_GAME_DATA: MISSING_NAME');
            });
            it('should reject with empty gameData.name', () => {
                const data = {
                    name: '',
                    topic: new forum.Topic(Math.random())
                };
                return Game.createGame(data).should.be.rejectedWith('E_INVALID_GAME_DATA: MISSING_NAME');
            });
            it('should reject with invalid gameData.topic', () => {
                const data = {
                    name: 'name',
                    topic: 'a string'
                };
                return Game.createGame(data).should.be.rejectedWith('E_INVALID_GAME_DATA: INVALID_TOPIC');
            });
        });
    });
});
