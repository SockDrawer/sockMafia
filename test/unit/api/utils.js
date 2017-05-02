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

describe('api/utils', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });
    afterEach(() => sandbox.restore());
    describe('module', () => {
        const fns = ['getGame', 'getUser', 'getGameForModActivity', 'extractUsername',
            'getUser', 'getModerator', 'getLivePlayer', 'extractPostId'
        ];
        it('should expose expected keys', () => {
            utilsApi.should.have.keys(fns);
        });
        fns.forEach((fn) => {
            it(`should expose '${fn}()' as a function`, () => {
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
            stubGetGameById = sandbox.stub(dao, 'getGameById').resolves(game);
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
    describe('getActiveGame()', () => {
        let dao, game, stubGetGame;
        beforeEach(() => {
            dao = new Dao(':memory:');
            game = new MafiaGame({}, {});
            stubGetGame = sandbox.stub(utilsApi, 'getGame').resolves(game);
        });
        it('should retrieve game via self getGame()', () => {
            const name = `name${Math.random()}`;
            return utilsApi.getActiveGame(name, dao).then(() => {
                stubGetGame.calledWith(name, dao);
            });
        });
        it('should resolve to game when active', () => {
            game._data.isActive = true;
            return utilsApi.getActiveGame('', dao).should.become(game);
        });
        it('should reject game when inactive', () => {
            game._data.isActive = false;
            return utilsApi.getActiveGame('', dao).should.be.rejectedWith('E_GAME_NOT_ACTIVE');
        });
        it('should reject if fetch rejects', () => {
            const err = new Error(`ERROR${Math.random()}`);
            stubGetGame.rejects(err);
            return utilsApi.getActiveGame('id', dao).should.be.rejectedWith(err);
        });
    });
    describe('getGameForModActivity()', () => {
        let dao, forum, game, user, stubGetActiveGame, stubGetModerator;
        beforeEach(() => {
            dao = new Dao(':memory:');
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
            game = new MafiaGame({}, {});
            user = new MafiaUser({
                isModerator: true
            }, {});
            stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(game);
            stubGetModerator = sandbox.stub(utilsApi, 'getModerator').resolves(user);
        });
        it('should retrieve game via self getActiveGame()', () => {
            const gameName = `name${Math.random()}`;
            return utilsApi.getGameForModActivity(gameName, 'mod', dao, forum).then(() => {
                stubGetActiveGame.calledWith(gameName, dao).should.be.true;
            });
        });
        it('should reject if fetch rejects', () => {
            const err = new Error(`ERROR${Math.random()}`);
            stubGetActiveGame.rejects(err);
            return utilsApi.getGameForModActivity('id', 'mod', dao, forum).should.be.rejectedWith(err);
        });
        it('should retrieve user via self GetModerator', () => {
            const name = `name${Math.random()}`;
            const tag = `name${Math.random()}`;
            return utilsApi.getGameForModActivity('id', name, dao, forum, tag).then(() => {
                stubGetModerator.calledWith(name, game, forum).should.be.true;
            });
        });
        it('should reject when getModerator rejects', () => {
            const name = new Error(`err${Math.random()}`);
            stubGetModerator.rejects(name);
            return utilsApi.getGameForModActivity('id', 'mod', dao, forum).should.be.rejectedWith(name);
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
            return utilsApi.extractUsername('', forum).should.be.rejectedWith('E_INVALID_ACTOR');
        });
        it('should reject for "duck-typed" user', () => {
            return utilsApi.extractUsername({
                username: 'name'
            }, forum).should.be.rejectedWith('E_INVALID_ACTOR');
        });
        it('should reject for random typed parameter', () => {
            return utilsApi.extractUsername(Math.random(), forum).should.be.rejectedWith('E_INVALID_ACTOR');
        });
        it('should reject with custom tag', () => {
            const tag = `tag${Math.random()}`;
            return utilsApi.extractUsername('', forum, tag).should.be.rejectedWith(`E_INVALID_${tag.toUpperCase()}`);
        });
    });
    describe('getUser()', () => {
        let forum, game, stubExtractUsername, stubGetPlayer, player;
        beforeEach(() => {
            forum = {
                User: function User(username) {
                    this.username = username;
                }
            };
            game = new MafiaGame({}, {});
            player = new MafiaUser({}, {});
            stubGetPlayer = sandbox.stub(game, 'getPlayer').resolves(player);
            stubExtractUsername = sandbox.stub(utilsApi, 'extractUsername').resolves();
        });
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
    describe('getModerator()', () => {
        let stubGetUser, mockUser;
        beforeEach(() => {
            mockUser = {
                isModerator: true
            };
            stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockUser);
        });
        it('should retrieve user via getUser', () => {
            const mod = `mod${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            const tag = `tag${Math.random()}`;
            return utilsApi.getModerator(mod, game, forum, tag).then(() => {
                stubGetUser.calledWith(mod, game, forum, tag).should.be.true;
            });
        });
        it('should provide default tag for omitted parameter', () => {
            const mod = `mod${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            return utilsApi.getModerator(mod, game, forum).then(() => {
                stubGetUser.calledWith(mod, game, forum, 'actor').should.be.true;
            });
        });
        it('should provide default tag for invalid parameter', () => {
            const mod = `mod${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            return utilsApi.getModerator(mod, game, forum, 42).then(() => {
                stubGetUser.calledWith(mod, game, forum, 'actor').should.be.true;
            });
        });
        it('should resolve to moderator', () => {
            return utilsApi.getModerator('mod', 'game', 'forum', 'tag').should.become(mockUser);
        });
        it('should reject when retrieved user is not a moderator', () => {
            const tag = `t${Math.random()}t`;
            mockUser.isModerator = false;
            return utilsApi.getModerator('mod', 'game', 'forum', tag).should.be.rejectedWith(`E_${tag.toUpperCase()}_NOT_MODERATOR`);
        });
    });
    describe('getLivePlayer()', () => {
        let mockUser, stubGetUser;
        beforeEach(() => {
            mockUser = {
                isModerator: false,
                isAlive: true
            };
            stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockUser);
        });
        it('should retrieve user via getUser', () => {
            const player = `player${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            const tag = `tag${Math.random()}`;
            return utilsApi.getLivePlayer(player, game, forum, tag).then(() => {
                stubGetUser.calledWith(player, game, forum, tag).should.be.true;
            });
        });
        it('should provide default tag for omitted parameter', () => {
            const player = `player${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            return utilsApi.getLivePlayer(player, game, forum).then(() => {
                stubGetUser.calledWith(player, game, forum, 'actor').should.be.true;
            });
        });
        it('should provide default tag for invalid parameter', () => {
            const player = `player${Math.random()}`;
            const game = `game${Math.random()}`;
            const forum = `forum${Math.random()}`;
            return utilsApi.getLivePlayer(player, game, forum, 42).then(() => {
                stubGetUser.calledWith(player, game, forum, 'actor').should.be.true;
            });
        });
        it('should resolve to player', () => {
            return utilsApi.getLivePlayer('player', 'game', 'forum', 'tag').should.become(mockUser);
        });
        it('should reject when retrieved user is moderator', () => {
            const tag = `t${Math.random()}t`;
            mockUser.isModerator = true;
            return utilsApi.getLivePlayer('mod', 'game', 'forum', tag).should.be.rejectedWith(`E_${tag.toUpperCase()}_NOT_PLAYER`);
        });
        it('should reject when retrieved user is dead, D. E. D. Dead.', () => {
            const tag = `t${Math.random()}t`;
            mockUser.isAlive = false;
            return utilsApi.getLivePlayer('mod', 'game', 'forum', tag).should.be.rejectedWith(`E_${tag.toUpperCase()}_NOT_ALIVE`);
        });
    });
    describe('extractPostId shenanigains', () => {
        let forum;
        beforeEach(() => {
            forum = forum = {
                Post: function Post(id) {
                    this.id = id;
                }
            };
        });
        it('should accept post id as number', () => {
            const id = Math.random();
            return utilsApi.extractPostId(id, forum).should.become(id);
        });
        it('should accept post id as forum.Post', () => {
            const id = Math.random();
            const post = new forum.Post(id);
            return utilsApi.extractPostId(post, forum).should.become(id);
        });
        it('should reject invalid typed post id', () => {
            const id = `post${Math.random()}`;
            return utilsApi.extractPostId(id, forum).should.be.rejectedWith('E_INVALID_POST');
        });
    });
});
