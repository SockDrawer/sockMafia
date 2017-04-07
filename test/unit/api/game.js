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
        describe('addPlayer()', () => {
            let stubGetGameById, stubAddPlayer, mockGame;
            beforeEach(() => {
                stubAddPlayer = sinon.stub().resolves();
                mockGame = {
                    addPlayer: stubAddPlayer
                };
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should reject when gameId is not presented', () => {
                return Game.addPlayer(undefined, 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject when user is not presented', () => {
                return Game.addPlayer('1f2a3d4e5d', undefined).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is empty string', () => {
                return Game.addPlayer('1f2a3d4e5d', '').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is generic object', () => {
                return Game.addPlayer('1f2a3d4e5d', {}).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should retrieve game by GameIdentifier', () =>{
                const id = `id ${Math.random()} id`;
                return Game.addPlayer(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Game.addPlayer('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should add player by string', () => {
                const name = `name ${Math.random()} name`;
                return Game.addPlayer('id', name).then(() => {
                    stubAddPlayer.calledWith(name).should.be.true;
                });
            });
            it('should add player by User', () => {
                const name = `name ${Math.random()} name`;
                return Game.addPlayer('id', new forum.User(name)).then(() => {
                    stubAddPlayer.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                 return Game.addPlayer('1f2a3d4e5d', 'foobar').should.become(undefined);
            });
        });
        describe('addModerator()', () => {
            let stubGetGameById, stubAddModerator, mockGame;
            beforeEach(() => {
                stubAddModerator = sinon.stub().resolves();
                mockGame = {
                    addModerator: stubAddModerator
                };
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should reject when gameId is not presented', () => {
                return Game.addModerator(undefined, 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject when user is not presented', () => {
                return Game.addModerator('1f2a3d4e5d', undefined).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is empty string', () => {
                return Game.addModerator('1f2a3d4e5d', '').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is generic object', () => {
                return Game.addModerator('1f2a3d4e5d', {}).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should retrieve game by GameIdentifier', () =>{
                const id = `id ${Math.random()} id`;
                return Game.addModerator(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Game.addModerator('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should add Moderator by string', () => {
                const name = `name ${Math.random()} name`;
                return Game.addModerator('id', name).then(() => {
                    stubAddModerator.calledWith(name).should.be.true;
                });
            });
            it('should add Moderator by User', () => {
                const name = `name ${Math.random()} name`;
                return Game.addModerator('id', new forum.User(name)).then(() => {
                    stubAddModerator.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                 return Game.addModerator('1f2a3d4e5d', 'foobar').should.become(undefined);
            });
        });
    });
});
