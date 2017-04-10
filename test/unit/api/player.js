'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaUser = require('../../../src/dao/mafiaUser'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
    playerApi = require('../../../src/api/player');

describe('api/player', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            playerApi.should.have.keys(['bindForum']);
            playerApi.bindForum.should.be.a.function;
        });
    });
    describe('Player', () => {
        let sandbox, Player, forum, dao;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {};

            dao = new Dao(':memory:');
            Player = playerApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
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
                return Player.addPlayer(undefined, 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject when user is not presented', () => {
                return Player.addPlayer('1f2a3d4e5d', undefined).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is empty string', () => {
                return Player.addPlayer('1f2a3d4e5d', '').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is generic object', () => {
                return Player.addPlayer('1f2a3d4e5d', {}).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.addPlayer(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.addPlayer('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should add player by string', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayer('id', name).then(() => {
                    stubAddPlayer.calledWith(name).should.be.true;
                });
            });
            it('should add player by User', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayer('id', new forum.User(name)).then(() => {
                    stubAddPlayer.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addPlayer('1f2a3d4e5d', 'foobar').should.become(undefined);
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
                return Player.addModerator(undefined, 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject when user is not presented', () => {
                return Player.addModerator('1f2a3d4e5d', undefined).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is empty string', () => {
                return Player.addModerator('1f2a3d4e5d', '').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject when user is generic object', () => {
                return Player.addModerator('1f2a3d4e5d', {}).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.addModerator(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.addModerator('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should add Moderator by string', () => {
                const name = `name ${Math.random()} name`;
                return Player.addModerator('id', name).then(() => {
                    stubAddModerator.calledWith(name).should.be.true;
                });
            });
            it('should add Moderator by User', () => {
                const name = `name ${Math.random()} name`;
                return Player.addModerator('id', new forum.User(name)).then(() => {
                    stubAddModerator.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addModerator('1f2a3d4e5d', 'foobar').should.become(undefined);
            });
        });
        describe('addPlayerProperty()', () => {
            let stubGetGameById, stubGetPlayer, stubAddProperty, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubAddProperty = sinon.stub(mockPlayer, 'addProperty').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.addPlayerProperty(id, 'george', 'foo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve user by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayerProperty('id', name, 'foo').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should retrieve user by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayerProperty('id', new forum.User(name), 'foo').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should add property as provided', () => {
                const property = `name ${Math.random()} name`;
                return Player.addPlayerProperty('id', 'foo', property).then(() => {
                    stubAddProperty.calledWith(property).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addPlayerProperty('id', 'foo', 'bar').should.become(undefined);
            });
            it('should reject if gameId not provided', () => {
                return Player.addPlayerProperty('', 'george', 'king').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong user type provided', () => {
                return Player.addPlayerProperty('id', 42, 'king').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.addPlayerProperty('id', 'george', 'king').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.rejects(expected);
                return Player.addPlayerProperty('id', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubAddProperty.rejects(expected);
                return Player.addPlayerProperty('id', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting fails', () => {
                stubAddProperty.resolves(false);
                return Player.addPlayerProperty('id', 'george', 'king').should.be.rejectedWith('E_PROPERTY_NOT_ADDED');
            });
        });
        describe('removePlayerProperty()', () => {
            let stubGetGameById, stubGetPlayer, stubRemoveProperty, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubRemoveProperty = sinon.stub(mockPlayer, 'removeProperty').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.removePlayerProperty(id, 'george', 'foo').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve user by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.removePlayerProperty('id', name, 'foo').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should retrieve user by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.removePlayerProperty('id', new forum.User(name), 'foo').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should remove property as provided', () => {
                const property = `name ${Math.random()} name`;
                return Player.removePlayerProperty('id', 'foo', property).then(() => {
                    stubRemoveProperty.calledWith(property).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.removePlayerProperty('id', 'foo', 'bar').should.become(undefined);
            });
            it('should reject if gameId not provided', () => {
                return Player.removePlayerProperty('', 'george', 'king').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong user type provided', () => {
                return Player.removePlayerProperty('id', 42, 'king').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.removePlayerProperty('id', 'george', 'king').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.rejects(expected);
                return Player.removePlayerProperty('id', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubRemoveProperty.rejects(expected);
                return Player.removePlayerProperty('id', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting fails', () => {
                stubRemoveProperty.resolves(false);
                return Player.removePlayerProperty('id', 'george', 'king').should.be.rejectedWith('E_PROPERTY_NOT_AVAILABLE_TO_REMOVE');
            });
        });
        describe('getPlayerProperties()', () => {
            let stubGetGameById, stubGetPlayer, stubGetProperties, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubGetProperties = sinon.stub(mockPlayer, 'getProperties').resolves([]);
                mockGame = new MafiaGame({}, {});
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.getPlayerProperties(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve user by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerProperties('id', name).then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should retrieve user by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerProperties('id', new forum.User(name)).then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should resolve to result of getProperties()', () => {
                const expected = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
                stubGetProperties.resolves(expected);
                return Player.getPlayerProperties('id', 'foo').should.become(expected);
            });
            it('should reject if gameId not provided', () => {
                return Player.getPlayerProperties('', 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong user type provided', () => {
                return Player.getPlayerProperties('id', 42).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.getPlayerProperties('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.rejects(expected);
                return Player.getPlayerProperties('id', 'george').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetProperties.rejects(expected);
                return Player.getPlayerProperties('id', 'george').should.be.rejectedWith(expected);
            });
        });
    });
});
