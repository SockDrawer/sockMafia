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
        let Player, forum, dao;
        beforeEach(() => {
            forum = {};
            dao = new Dao(':memory:');
            Player = playerApi.bindForum(forum, dao);
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
        describe('addPlayerProperty()', () => {
            let stubGetGameById, stubGetPlayer, stubSetValue, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubSetValue = sinon.stub(mockPlayer, 'setValue').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.setPlayerValue(id, 'george', 'foo', 'bar').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve user by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.setPlayerValue('id', name, 'foo', 'bar').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should retrieve user by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.setPlayerValue('id', new forum.User(name), 'foo', 'bar').then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should setValue as provided', () => {
                const name = `name ${Math.random()} name`;
                const value = `value ${Math.random()} value`;
                return Player.setPlayerValue('id', 'foo', name, value).then(() => {
                    stubSetValue.calledWith(name, value).should.be.true;
                });
            });
            it('should resolve to result of setValue()', () => {
                const expected = {
                    id: Math.random()
                };
                stubSetValue.resolves(expected);
                return Player.setPlayerValue('id', 'foo', 'bar', 'bar').should.become(expected);
            });
            it('should reject if gameId not provided', () => {
                return Player.setPlayerValue('', 'george', 'king', 'bar').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong user type provided', () => {
                return Player.setPlayerValue('id', 42, 'king', 'bar').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.setPlayerValue('id', 'george', 'king', 'bar').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.rejects(expected);
                return Player.setPlayerValue('id', 'george', 'king', 'bar').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubSetValue.rejects(expected);
                return Player.setPlayerValue('id', 'george', 'king', 'bar').should.be.rejectedWith(expected);
            });
        });
        describe('getPlayerValues()', () => {
            let stubGetGameById, stubGetPlayer, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                mockGame = new MafiaGame({}, {});
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.getPlayerValues(id, 'george').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve user by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerValues('id', name).then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should retrieve user by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerValues('id', new forum.User(name)).then(() => {
                    stubGetPlayer.calledWith(name).should.be.true;
                });
            });
            it('should return values as retrieved from game', () => {
                const expected = {
                    'key ${Math.random()}': Math.random()
                };
                stubGetPlayer.resolves({
                    values: expected
                });
                return Player.getPlayerValues('id', 'id').then((values) => {
                    values.should.equal(expected);
                });
            });
            it('should reject if gameId not provided', () => {
                return Player.getPlayerValues('', 'george').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong user type provided', () => {
                return Player.getPlayerValues('id', 42).should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.getPlayerValues('id', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.rejects(expected);
                return Player.getPlayerValues('id', 'george').should.be.rejectedWith(expected);
            });
        });
        describe('sendRoleCard()', () => {
            let stubGetGameById, stubGetPlayer, stubCreatePM, stubSetValue, stubAddChat, stubGetUserByName,
                mockGame, mockModerator, mockPlayer;
            beforeEach(() => {
                mockModerator = new MafiaUser({
                    isModerator: true
                }, {});
                mockPlayer = new MafiaUser({}, {});
                stubSetValue = sinon.stub(mockPlayer, 'setValue').resolves();
                mockGame = new MafiaGame({}, {});
                stubAddChat = sinon.stub(mockGame, 'addChat');
                stubGetPlayer = sinon.stub(mockGame, 'getPlayer').rejects(new Error('BAD_CALL'));
                stubGetPlayer.onFirstCall().resolves(mockModerator);
                stubGetPlayer.onSecondCall().resolves(mockPlayer);
                stubGetGameById = sinon.stub(dao, 'getGameById').resolves(mockGame);
                stubCreatePM = sinon.stub().resolves({});
                stubGetUserByName = sinon.stub().resolves();
                forum.User = function(username) {
                    this.username = username;
                };
                forum.User.getByName = stubGetUserByName;
                forum.PrivateMessage = {
                    create: stubCreatePM
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                return Player.sendRoleCard(id, 'george', 'michael', 'test').then(() => {
                    stubGetGameById.calledWith(id).should.be.true;
                });
            });
            it('should retrieve moderator from dao by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard('id', name, 'michael', 'text').then(() => {
                    stubGetPlayer.firstCall.calledWith(name).should.be.true;
                });
            });
            it('should retrieve moderator from dao by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard('id', new forum.User(name), 'michael', 'text').then(() => {
                    stubGetPlayer.firstCall.calledWith(name).should.be.true;
                });
            });
            it('should retrieve player from dao by string username', () => {
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard('id', 'george', name, 'text').then(() => {
                    stubGetPlayer.secondCall.calledWith(name).should.be.true;
                });
            });
            it('should retrieve player from dao by forum.User', () => {
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard('id', 'george', new forum.User(name), 'text').then(() => {
                    stubGetPlayer.secondCall.calledWith(name).should.be.true;
                });
            });
            it('should retrieve moderators from forum by name', () => {
                const expected = [];
                for (let i = 0; i < 10; i += 1) {
                    const name = `george${i}`;
                    expected.push(name);
                    mockGame._data.moderators[name] = {
                        username: name
                    };
                }
                return Player.sendRoleCard('id', 'george', 'michael', 'text').then(() => {
                    expected.forEach((value) => stubGetUserByName.calledWith(value).should.be.true);
                    stubGetUserByName.callCount.should.equal(11);
                });
            });
            it('should retrieve player from forum by name', () => {
                const name = `name ${Math.random()} name`;
                mockPlayer._data.username = name;
                return Player.sendRoleCard('id', 'george', name, 'text').then(() => {
                    stubGetUserByName.calledWith(name).should.be.true;
                });
            });
            it('should create PrivateMessage with expected users', () => {
                const expected = [];
                for (let i = 0; i < 10; i += 1) {
                    const name = `george${i}`;
                    expected.push(name);
                    mockGame._data.moderators[name] = {
                        username: name
                    };
                    stubGetUserByName.onCall(i).resolves(name);
                }
                const player = `player ${Math.random()}`;
                expected.push(player);
                stubGetUserByName.onCall(10).resolves(player);
                return Player.sendRoleCard('id', 'george', 'michael', 'text').then(() => {
                    stubCreatePM.called.should.be.true;
                    stubCreatePM.firstCall.args[0].should.deep.equal(expected);
                });
            });
            it('should create PrivateMessage with expected content', () => {
                const content = `content ${Math.random()}`;
                return Player.sendRoleCard('id', 'george', 'michael', content).then(() => {
                    stubCreatePM.called.should.be.true;
                    stubCreatePM.firstCall.args[1].should.deep.equal(content);
                });
            });
            it('should create PrivateMessage with name based on game name', () => {
                const name = `gamename ${Math.random()}`;
                mockGame._data.name = name;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').then(() => {
                    stubCreatePM.called.should.be.true;
                    stubCreatePM.firstCall.args[2].should.deep.equal(`Rolecard for ${name}`);
                });
            });
            it('should create PrivateMessage with name based on game rolecard-title', () => {
                const name = `gamename ${Math.random()}`;
                mockGame._data.values['rolecard-title'] = name;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').then(() => {
                    stubCreatePM.called.should.be.true;
                    stubCreatePM.firstCall.args[2].should.deep.equal(name);
                });
            });
            it('should add chat to game', () => {
                const id = Math.random();
                stubCreatePM.resolves({
                    id: id
                });
                return Player.sendRoleCard('id', 'george', 'michael', 'test').then(() => {
                    stubAddChat.calledWith(id).should.be.true;
                });
            });
            it('should add chat to player values as `rolecard-id`', () => {
                const id = Math.random();
                stubCreatePM.resolves({
                    id: id
                });
                return Player.sendRoleCard('id', 'george', 'michael', 'test').then(() => {
                    stubSetValue.calledWith('rolecard-id', id).should.be.true;
                });
            });
            it('should add rolecard text to player as `rolecard-title`', () => {
                const text = `text ${Math.random()}`;
                return Player.sendRoleCard('id', 'george', 'michael', text).then(() => {
                    stubSetValue.calledWith('rolecard-text', text).should.be.true;
                });
            });
            it('should add rolecard title to player as `rolecard-title`', () => {
                const name = `gamename ${Math.random()}`;
                mockGame._data.values['rolecard-title'] = name;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').then(() => {
                    stubSetValue.calledWith('rolecard-title', name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.become(undefined);
            });
            it('should require sender to be a moderator', () => {
                mockModerator._data.isModerator = false;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_SENDER_IS_NOT_MODERATOR');
            });
            it('should require player to be alive', () => {
                mockPlayer._data.isAlive = false;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_TARGET_IS_NOT_ALIVE');
            });
            it('should require player to not be a modereator', () => {
                mockPlayer._data.isModerator = true;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_TARGET_IS_MODERATOR');
            });
            it('should reject if gameId not provided', () => {
                return Player.sendRoleCard('', 'george', 'michael', 'test').should.be.rejectedWith('E_MISSING_GAME_IDENTIFIER');
            });
            it('should reject if wrong moderator type provided', () => {
                return Player.sendRoleCard('id', 42, 'michael', 'test').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if wrong player type provided', () => {
                return Player.sendRoleCard('id', 'george', 42, 'test').should.be.rejectedWith('E_INVALID_USER');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameById.rejects(new Error('E_NO_GAME'));
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if moderator retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.onFirstCall().rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
            it('should reject if player retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetPlayer.onSecondCall().rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
            it('should reject if user lookup fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUserByName.rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
            it('should reject if PrivateMessage creation fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubCreatePM.rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
            it('should reject if adding chat to game fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubAddChat.rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
            it('should reject if adding chat to player fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubSetValue.rejects(expected);
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith(expected);
            });
        });
    });
});
