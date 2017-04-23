'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaUser = require('../../../src/dao/mafiaUser'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
    playerApi = require('../../../src/api/player'),
    utilsApi = require('../../../src/api/utils');

describe('api/player', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            playerApi.should.have.keys(['bindForum']);
            playerApi.bindForum.should.be.a.function;
        });
    });
    describe('Player', () => {
        let Player, forum, dao, sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {};
            dao = new Dao(':memory:');
            Player = playerApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('addPlayer()', () => {
            let stubGetGameForModActivity, stubExtractUsername, stubAddPlayer, mockGame;
            beforeEach(() => {
                stubAddPlayer = sinon.stub().resolves();
                mockGame = {
                    addPlayer: stubAddPlayer
                };
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                stubExtractUsername = sandbox.stub(utilsApi, 'extractUsername').resolves();
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                const mod = `mod ${Math.random()}`;
                return Player.addPlayer(id, mod, 'george').then(() => {
                    stubGetGameForModActivity.calledWith(id, mod, dao, forum).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.addPlayer('id', 'mod', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should extract username via utils.extractUsername', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayer('id', 'mod', name).then(() => {
                    stubExtractUsername.calledWith(name, forum, 'user').should.be.true;
                });
            });
            it('should reject when utils.extractUsername rejects', () => {
                const err = new Error(`err ${Math.random()}`);
                stubExtractUsername.rejects(err);
                return Player.addPlayer('id', 'mod', 'name').should.be.rejectedWith(err);
            });
            it('should add player by with extractedUsername', () => {
                const name = `name ${Math.random()} name`;
                stubExtractUsername.resolves(name);
                return Player.addPlayer('id', 'mod', 'name').then(() => {
                    stubAddPlayer.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addPlayer('1f2a3d4e5d', 'mod', 'foobar').should.become(undefined);
            });
        });
        describe('addModerator()', () => {
            let stubGetGameForModActivity, stubAddModerator, stubExtractUsername, mockGame;
            beforeEach(() => {
                stubAddModerator = sinon.stub().resolves();
                mockGame = {
                    addModerator: stubAddModerator
                };
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                stubExtractUsername = sandbox.stub(utilsApi, 'extractUsername').resolves();
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                const mod = `mod ${Math.random()}`;
                return Player.addModerator(id, mod, 'george').then(() => {
                    stubGetGameForModActivity.calledWith(id, mod, dao, forum).should.be.true;
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.addModerator('id', 'mod', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should extract username via utils.extractUsername', () => {
                const name = `name ${Math.random()} name`;
                return Player.addModerator('id', 'mod', name).then(() => {
                    stubExtractUsername.calledWith(name, forum, 'moderator').should.be.true;
                });
            });
            it('should reject when utils.extractUsername rejects', () => {
                const err = new Error(`err ${Math.random()}`);
                stubExtractUsername.rejects(err);
                return Player.addModerator('id', 'mod', 'name').should.be.rejectedWith(err);
            });
            it('should add player by with extractedUsername', () => {
                const name = `name ${Math.random()} name`;
                stubExtractUsername.resolves(name);
                return Player.addModerator('id', 'mod', 'name').then(() => {
                    stubAddModerator.calledWith(name).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addModerator('1f2a3d4e5d', 'mod', 'foobar').should.become(undefined);
            });
        });
        describe('addPlayerProperty()', () => {
            let stubGetGameForModActivity, stubGetUser, stubAddProperty, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubAddProperty = sandbox.stub(mockPlayer, 'addProperty').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                const mod = `mod ${Math.random()} mod`;
                return Player.addPlayerProperty(id, mod, 'george', 'foo').then(() => {
                    stubGetGameForModActivity.calledWith(id, mod, dao, forum).should.be.true;
                });
            });
            it('should retrieve user via utils', () => {
                const name = `name ${Math.random()} name`;
                return Player.addPlayerProperty('id', 'mod', name, 'foo').then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should add property as provided', () => {
                const property = `name ${Math.random()} name`;
                return Player.addPlayerProperty('id', 'mod', 'foo', property).then(() => {
                    stubAddProperty.calledWith(property).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.addPlayerProperty('id', 'mod', 'foo', 'bar').should.become(undefined);
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.addPlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
                return Player.addPlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubAddProperty.rejects(expected);
                return Player.addPlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting fails', () => {
                stubAddProperty.resolves(false);
                return Player.addPlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith('E_PROPERTY_NOT_ADDED');
            });
        });
        describe('removePlayerProperty()', () => {
            let stubGetGameForModActivity, stubGetUser, stubRemoveProperty, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubRemoveProperty = sandbox.stub(mockPlayer, 'removeProperty').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by GameIdentifier', () => {
                const id = `id ${Math.random()} id`;
                const name = `name ${Math.random()}`;
                return Player.removePlayerProperty(id, name, 'george', 'foo').then(() => {
                    stubGetGameForModActivity.calledWith(id, name, dao, forum).should.be.true;
                });
            });
            it('should retrieve user utils', () => {
                const name = `name ${Math.random()} name`;
                return Player.removePlayerProperty('id', 'mod', name, 'foo').then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should remove property as provided', () => {
                const property = `name ${Math.random()} name`;
                return Player.removePlayerProperty('id', 'mod', 'foo', property).then(() => {
                    stubRemoveProperty.calledWith(property).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Player.removePlayerProperty('id', 'mod', 'foo', 'bar').should.become(undefined);
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.removePlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
                return Player.removePlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubRemoveProperty.rejects(expected);
                return Player.removePlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith(expected);
            });
            it('should reject if property setting fails', () => {
                stubRemoveProperty.resolves(false);
                return Player.removePlayerProperty('id', 'mod', 'george', 'king').should.be.rejectedWith('E_PROPERTY_NOT_AVAILABLE_TO_REMOVE');
            });
        });
        describe('getPlayerProperties()', () => {
            let stubGetGameForModActivity, stubGetUser, stubGetProperties, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubGetProperties = sandbox.stub(mockPlayer, 'getProperties').resolves([]);
                mockGame = new MafiaGame({}, {});
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by getGameForModActivity', () => {
                const id = `id ${Math.random()} id`;
                const name = `name ${Math.random()} name`;
                return Player.getPlayerProperties(id, name, 'george').then(() => {
                    stubGetGameForModActivity.calledWith(id, name, dao, forum).should.be.true;
                });
            });
            it('should retrieve user by utils', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerProperties('id', 'mod', name).then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should resolve to result of getProperties()', () => {
                const expected = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
                stubGetProperties.resolves(expected);
                return Player.getPlayerProperties('id', 'mod', 'foo').should.become(expected);
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.getPlayerProperties('id', 'mod', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
                return Player.getPlayerProperties('id', 'mod', 'george').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetProperties.rejects(expected);
                return Player.getPlayerProperties('id', 'mod', 'george').should.be.rejectedWith(expected);
            });
        });
        describe('setPlayerValue()', () => {
            let stubGetGameForModActivity, stubGetUser, stubSetValue, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubSetValue = sandbox.stub(mockPlayer, 'setValue').resolves(true);
                mockGame = new MafiaGame({}, {});
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by getGameForModActivity', () => {
                const id = `id ${Math.random()} id`;
                const name = `name ${Math.random()} name`;
                return Player.setPlayerValue(id, name, 'george', 'foo', 'bar').then(() => {
                    stubGetGameForModActivity.calledWith(id, name, dao, forum).should.be.true;
                });
            });
            it('should retrieve user by utils', () => {
                const name = `name ${Math.random()} name`;
                return Player.setPlayerValue('id', 'mod', name, 'foo', 'bar').then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should setValue as provided', () => {
                const name = `name ${Math.random()} name`;
                const value = `value ${Math.random()} value`;
                return Player.setPlayerValue('id', 'mod', 'foo', name, value).then(() => {
                    stubSetValue.calledWith(name, value).should.be.true;
                });
            });
            it('should resolve to result of setValue()', () => {
                const expected = {
                    id: Math.random()
                };
                stubSetValue.resolves(expected);
                return Player.setPlayerValue('id', 'mod', 'foo', 'bar', 'bar').should.become(expected);
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.setPlayerValue('id', 'mod', 'george', 'king', 'bar').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
                return Player.setPlayerValue('id', 'mod', 'george', 'king', 'bar').should.be.rejectedWith(expected);
            });
            it('should reject if property setting rejects', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubSetValue.rejects(expected);
                return Player.setPlayerValue('id', 'mod', 'george', 'king', 'bar').should.be.rejectedWith(expected);
            });
        });
        describe('getPlayerValues()', () => {
            let stubGetGameForModActivity, stubGetUser, mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                mockGame = new MafiaGame({}, {});
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
                forum.User = function(username) {
                    this.username = username;
                };
            });
            it('should retrieve game by getGameForModActivity', () => {
                const id = `id ${Math.random()} id`;
                const name = `name ${Math.random()} name`;
                return Player.getPlayerValues(id, name, 'george').then(() => {
                    stubGetGameForModActivity.calledWith(id, name, dao, forum).should.be.true;
                });
            });
            it('should retrieve user by utils', () => {
                const name = `name ${Math.random()} name`;
                return Player.getPlayerValues('id', 'mod', name).then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should return values as retrieved from game', () => {
                const expected = {
                    'key ${Math.random()}': Math.random()
                };
                stubGetUser.resolves({
                    values: expected
                });
                return Player.getPlayerValues('id', 'mod', 'player').then((values) => {
                    values.should.equal(expected);
                });
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.getPlayerValues('id', 'mod', 'george').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if user retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
                return Player.getPlayerValues('id', 'mod', 'george').should.be.rejectedWith(expected);
            });
        });
        describe('sendRoleCard()', () => {
            let stubGetGameForModActivity, stubGetUser, stubCreatePM, stubSetValue, stubAddChat, stubGetUserByName,
                mockGame, mockPlayer;
            beforeEach(() => {
                mockPlayer = new MafiaUser({}, {});
                stubSetValue = sandbox.stub(mockPlayer, 'setValue').resolves();
                mockGame = new MafiaGame({}, {});
                stubAddChat = sandbox.stub(mockGame, 'addChat');
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockPlayer);
                stubGetGameForModActivity = sandbox.stub(utilsApi, 'getGameForModActivity').resolves(mockGame);
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
            it('should retrieve game by getGameForModActivity', () => {
                const id = `id ${Math.random()} id`;
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard(id, name, 'michael', 'test').then(() => {
                    stubGetGameForModActivity.calledWith(id, name, dao, forum).should.be.true;
                });
            });
            it('should retrieve player from util helper', () => {
                const name = `name ${Math.random()} name`;
                return Player.sendRoleCard('id', 'george', name, 'text').then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
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
            it('should require player to be alive', () => {
                mockPlayer._data.isAlive = false;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_TARGET_IS_NOT_ALIVE');
            });
            it('should require player to not be a modereator', () => {
                mockPlayer._data.isModerator = true;
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_TARGET_IS_MODERATOR');
            });
            it('should reject if game retrieval fails', () => {
                stubGetGameForModActivity.rejects(new Error('E_NO_GAME'));
                return Player.sendRoleCard('id', 'george', 'michael', 'test').should.be.rejectedWith('E_NO_GAME');
            });
            it('should reject if player retrieval fails', () => {
                const expected = new Error(`error ${Math.random()}`);
                stubGetUser.rejects(expected);
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
