'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
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
            it('should retrieve game by GameIdentifier', () => {
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
            it('should retrieve game by GameIdentifier', () => {
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
        describe('addPlayArea()', () => {
            let stubGetGameById, stubAddTopic, stubAddChat, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubAddTopic = sinon.stub(mockGame, 'addTopic').resolves();
                stubAddChat = sinon.stub(mockGame, 'addChat').resolves();
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.Topic = function(id) {
                    this.id = id;
                };
                forum.PrivateMessage = function(id) {
                    this.id = id;
                };
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.addPlayArea(id, new forum.Topic()).then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should add topic when presented with a Topic', () => {
                const id = Math.random();
                return Game.addPlayArea('id', new forum.Topic(id)).then(() => {
                    stubAddTopic.calledWith(id).should.be.true;
                });
            });
            it('should add chat when presented with a PrivateMessage', () => {
                const id = Math.random();
                return Game.addPlayArea('id', new forum.PrivateMessage(id)).then(() => {
                    stubAddChat.calledWith(id).should.be.true;
                });
            });
            it('should resolve to undefined when presented with a Topic', () => {
                return Game.addPlayArea('id', new forum.Topic()).should.become(undefined);
            });
            it('should resolve to undefined when presented with a PrivateMessage', () => {
                return Game.addPlayArea('id', new forum.PrivateMessage()).should.become(undefined);
            });
            it('should reject when getGameById rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubGetGameById.rejects(error);
                return Game.addPlayArea('id', new forum.Topic()).should.be.rejectedWith(error);
            });
            it('should reject when addTopic rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubAddTopic.rejects(error);
                return Game.addPlayArea('id', new forum.Topic()).should.be.rejectedWith(error);
            });
            it('should reject when addChat rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubAddChat.rejects(error);
                return Game.addPlayArea('id', new forum.PrivateMessage()).should.be.rejectedWith(error);
            });
            it('should reject when proviced wron play area type', () => {
                return Game.addPlayArea('id', 'bad').should.be.rejectedWith('E_INVALID_PLAY_AREA');
            });
        });
        describe('removePlayArea()', () => {
            let stubGetGameById, stubRemoveTopic, stubRemoveChat, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubRemoveTopic = sinon.stub(mockGame, 'removeTopic').resolves(true);
                stubRemoveChat = sinon.stub(mockGame, 'removeChat').resolves(true);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.Topic = function(id) {
                    this.id = id;
                };
                forum.PrivateMessage = function(id) {
                    this.id = id;
                };
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.removePlayArea(id, new forum.Topic()).then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should remove topic when presented with a Topic', () => {
                const id = Math.random();
                return Game.removePlayArea('id', new forum.Topic(id)).then(() => {
                    stubRemoveTopic.calledWith(id).should.be.true;
                });
            });
            it('should remove chat when presented with a PrivateMessage', () => {
                const id = Math.random();
                return Game.removePlayArea('id', new forum.PrivateMessage(id)).then(() => {
                    stubRemoveChat.calledWith(id).should.be.true;
                });
            });
            it('should resolve to undefined when presented with a Topic', () => {
                return Game.removePlayArea('id', new forum.Topic()).should.become(undefined);
            });
            it('should resolve to undefined when presented with a PrivateMessage', () => {
                return Game.removePlayArea('id', new forum.PrivateMessage()).should.become(undefined);
            });
            it('should reject when getGameById rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubGetGameById.rejects(error);
                return Game.removePlayArea('id', new forum.Topic()).should.be.rejectedWith(error);
            });
            it('should reject when removeTopic rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubRemoveTopic.rejects(error);
                return Game.removePlayArea('id', new forum.Topic()).should.be.rejectedWith(error);
            });
            it('should reject when removeChat rejects', () => {
                const error = new Error(`Something bad ${Math.random()}`);
                stubRemoveChat.rejects(error);
                return Game.removePlayArea('id', new forum.PrivateMessage()).should.be.rejectedWith(error);
            });
            it('should reject when proviced wrong play area type', () => {
                return Game.removePlayArea('id', 'bad').should.be.rejectedWith('E_INVALID_PLAY_AREA');
            });
            it('should reject when removing topic fails', () => {
                stubRemoveTopic.resolves(false);
                return Game.removePlayArea('id', new forum.Topic()).should.be.rejectedWith('E_PLAY_AREA_NOT_IN_GAME');
            });
            it('should reject when removing chat fails', () => {
                stubRemoveChat.resolves(false);
                return Game.removePlayArea('id', new forum.PrivateMessage()).should.be.rejectedWith('E_PLAY_AREA_NOT_IN_GAME');
            });
        });
        describe('addAlias()', () => {
            let stubGetGameById, stubAddAlias, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubAddAlias = sinon.stub(mockGame, 'addAlias').resolves();
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.addGameAlias(id, 'boo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should add alias when presented with a string', () => {
                const id = `${Math.random()}`;
                return Game.addGameAlias('id', id).then(() => {
                    stubAddAlias.calledWith(id).should.be.true;
                });
            });
            it('should resolve to undefined when presented with a string', () => {
                return Game.addGameAlias('id', 'foobar').should.become(undefined);
            });
            it('should reject zero length alias', () => {
                return Game.addGameAlias('id', '').should.be.rejectedWith('E_INVALID_ALIAS');
            });
            it('should reject non string alias', () => {
                return Game.addGameAlias('id', 42).should.be.rejectedWith('E_INVALID_ALIAS');
            });
            it('should reject when getGameById rejects', () => {
                const error = new Error(`DANGER ${Math.random()}! DANGER!`);
                stubGetGameById.rejects(error);
                return Game.addGameAlias('id', 'foobar').should.be.rejectedWith(error);
            });
            it('should reject when addAlias rejects', () => {
                const error = new Error(`DANGER ${Math.random()}! DANGER!`);
                stubAddAlias.rejects(error);
                return Game.addGameAlias('id', 'foobar').should.be.rejectedWith(error);
            });
        });
        describe('removeAlias()', () => {
            let stubGetGameById, stubRemoveAlias, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubRemoveAlias = sinon.stub(mockGame, 'removeAlias').resolves(true);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.removeGameAlias(id, 'boo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should remove alias when presented with a string', () => {
                const id = `${Math.random()}`;
                return Game.removeGameAlias('id', id).then(() => {
                    stubRemoveAlias.calledWith(id).should.be.true;
                });
            });
            it('should resolve to undefined when presented with a string', () => {
                return Game.removeGameAlias('id', 'foobar').should.become(undefined);
            });
            it('should reject zero length alias', () => {
                return Game.removeGameAlias('id', '').should.be.rejectedWith('E_INVALID_ALIAS');
            });
            it('should reject non string alias', () => {
                return Game.removeGameAlias('id', 42).should.be.rejectedWith('E_INVALID_ALIAS');
            });
            it('should resject when getGameById rejects', () => {
                const error = new Error(`DANGER ${Math.random()}! DANGER!`);
                stubGetGameById.rejects(error);
                return Game.removeGameAlias('id', 'foobar').should.be.rejectedWith(error);
            });
            it('should reject when removeAlias rejects', () => {
                const error = new Error(`DANGER ${Math.random()}! DANGER!`);
                stubRemoveAlias.rejects(error);
                return Game.removeGameAlias('id', 'foobar').should.be.rejectedWith(error);
            });
            it('should reject when removeAlias resolves falsy', () => {
                stubRemoveAlias.resolves(false);
                return Game.removeGameAlias('id', 'foobar').should.be.rejectedWith('E_ALIAS_NOT_EXISTS');
            });
        });
        describe('setGameValue()', () => {
            let stubGetGameById, stubSetValue, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubSetValue = sinon.stub(mockGame, 'setValue').resolves();
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.setGameValue(id, 'boo', 'foo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should pass key and value to setValue()', () => {
                const key = `key ${Math.random()}`;
                const value = `value ${Math.random()}`;
                return Game.setGameValue('id', key, value).then(() => {
                    stubSetValue.calledWith(key, value).should.be.true;
                });
            });
            it('should resolve to result of setValue()', () => {
                const expected = `value ${Math.random()}`;
                stubSetValue.resolves(expected);
                return Game.setGameValue('a', 'b', 'c').should.become(expected);
            });
            it('should tolerate missing value', () => {
                return Game.setGameValue('a', 'b').should.resolve;
            });
            it('should reject non string key', () => {
                return Game.setGameValue('a', false).should.be.rejectedWith('E_INVALID_KEY');
            });
            it('should reject empty key', () => {
                return Game.setGameValue('a', '').should.be.rejectedWith('E_INVALID_KEY');
            });
            it('should reject when getGameById rejects', () => {
                const expected = new Error(`value ${Math.random()}`);
                stubGetGameById.rejects(expected);
                return Game.setGameValue('a', 'b', 'c').should.be.rejectedWith(expected);
            });
            it('should reject when setValue() rejects', () => {
                const expected = new Error(`value ${Math.random()}`);
                stubSetValue.rejects(expected);
                return Game.setGameValue('a', 'b', 'c').should.be.rejectedWith(expected);
            });
        });
        describe('getGameValues()', () => {
            let stubGetGameById, mockGame;
            beforeEach(() => {
                mockGame = new MafiaGame({}, {});
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
            });
            it('should retrieve game by id', () => {
                const id = `id ${Math.random()} id`;
                return Game.getGameValues(id, 'boo', 'foo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should return values as retrieved from game', () => {
                const expected = {
                    'key ${Math.random()}': Math.random()
                };
                stubGetGameById.resolves({
                    values: expected
                });
                return Game.getGameValues('id').then((values) => {
                    values.should.equal(expected);
                });
            });
            it('should reject when getGameById rejects', () => {
                const expected = new Error(`value ${Math.random()}`);
                stubGetGameById.rejects(expected);
                return Game.getGameValues('a').should.be.rejectedWith(expected);
            });
        });
    });
});
