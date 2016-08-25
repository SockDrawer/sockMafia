'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
chai.use(require('chai-as-promised'));

chai.should();

const MafiaGame = require('../../../src/dao/mafiaGame'),
    MafiaAction = require('../../../src/dao/mafiaAction'),
    MafiaUser = require('../../../src/dao/mafiaUser');

describe('nouveau dao/MafiaGame', () => {
    it('should export a function', () => {
        MafiaGame.should.be.a('function');
    });
    it('should be a constructor', () => {
        const obj = new MafiaGame({});
        obj.should.be.an.instanceOf(MafiaGame);
    });
    describe('ctor()', () => {
        it('should store data', () => {
            const obj = {};
            const game = new MafiaGame(obj);
            game._data.should.equal(obj);
        });
        it('should store dao', () => {
            const obj = {};
            const game = new MafiaGame({}, obj);
            game._dao.should.equal(obj);
        });
        it('should store provided name', () => {
            const name = `name${Math.random()}`;
            const obj = {
                name: name
            };
            const game = new MafiaGame(obj);
            game._data.name.should.equal(name);
        });
        it('should store provided day', () => {
            const day = Math.random();
            const obj = {
                day: day
            };
            const game = new MafiaGame(obj);
            game._data.day.should.equal(day);
        });
        it('should store provided phases', () => {
            const phases = [`${Math.random()}`, `${Math.random()}`];
            const obj = {
                phases: phases
            };
            const game = new MafiaGame(obj);
            game._data.phases.should.equal(phases);
        });
        it('should store provided phase', () => {
            const phases = [`${Math.random()}`, `${Math.random()}`, `${Math.random()}`];
            const phase = phases[1];
            const obj = {
                phases: phases,
                phase: phase
            };
            const game = new MafiaGame(obj);
            game._data.phase.should.equal(phase);
        });
        it('should store isActive as provided', () => {
            const activeGame = new MafiaGame({
                isActive: true
            });
            activeGame._data.isActive.should.equal(true);
            const inactiveGame = new MafiaGame({
                isActive: false
            });
            inactiveGame._data.isActive.should.equal(false);
        });
        it('should store livePlayers as provided', () => {
            const obj = {};
            const activeGame = new MafiaGame({
                livePlayers: obj
            });
            activeGame._data.livePlayers.should.equal(obj);
        });
        it('should store deadPlayers as provided', () => {
            const obj = {};
            const activeGame = new MafiaGame({
                deadPlayers: obj
            });
            activeGame._data.deadPlayers.should.equal(obj);
        });
        it('should store moderators as provided', () => {
            const obj = {};
            const activeGame = new MafiaGame({
                moderators: obj
            });
            activeGame._data.moderators.should.equal(obj);
        });
        it('should store actions as provided', () => {
            const obj = [];
            const activeGame = new MafiaGame({
                actions: obj
            });
            activeGame._data.actions.should.equal(obj);
        });
        it('should generate name when not provided', () => {
            const topic = Math.random();
            const expected = `mafia_${topic}`;
            const obj = {
                topicId: topic
            };
            const game = new MafiaGame(obj);
            game._data.name.should.equal(expected);
        });
        it('should generate day when not provided', () => {
            const obj = {};
            const game = new MafiaGame(obj);
            game._data.day.should.equal(1);
        });
        it('should generate phases when not provided', () => {
            const obj = {};
            const game = new MafiaGame(obj);
            game._data.phases.should.eql(['day', 'night']);
        });
        it('should generate phase when not provided', () => {
            const phases = [`${Math.random()}`, `${Math.random()}`];
            const obj = {
                phases: phases
            };
            const game = new MafiaGame(obj);
            game._data.phase.should.eql(phases[0]);
        });
        it('should generate phase when non sensical phase provided', () => {
            const phases = [`${Math.random()}`, `${Math.random()}`];
            const obj = {
                phases: phases,
                phase: 4
            };
            const game = new MafiaGame(obj);
            game._data.phase.should.eql(phases[0]);
        });
        it('should generate isActive status when not provided', () => {
            const obj = {};
            const game = new MafiaGame(obj);
            game._data.isActive.should.equal(true);
        });
        it('should generate livePlayers when not provided', () => {
            const activeGame = new MafiaGame({});
            activeGame._data.livePlayers.should.eql({});
        });
        it('should generate deadPlayers when not provided', () => {
            const activeGame = new MafiaGame({});
            activeGame._data.deadPlayers.should.eql({});
        });
        it('should generate moderators when not provided', () => {
            const activeGame = new MafiaGame({});
            activeGame._data.moderators.should.eql({});
        });
        it('should generate actions when not provided', () => {
            const activeGame = new MafiaGame({});
            activeGame._data.actions.should.eql([]);
        });
    });
    describe('simple getters', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        ['topicId', 'name', 'day', 'phase', 'isActive'].forEach((getter) => {
            it(`should have a simple getter for ${getter}`, () => {
                const expected = Math.random();
                game._data[getter] = expected;
                game[getter].should.equal(expected);
            });
        });
    });
    describe('getter isDay', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be day for phase `day`', () => {
            game._data.phase = 'day';
            game.isDay.should.be.true;
        });
        it('should be day for phase `DAY`', () => {
            game._data.phase = 'DAY';
            game.isDay.should.be.true;
        });
        it('should be day for phase `daylight`', () => {
            game._data.phase = 'daylight';
            game.isDay.should.be.true;
        });
        it('should be day for phase `today`', () => {
            game._data.phase = 'today';
            game.isDay.should.be.true;
        });
        it('should not be day for phase `da-ay`', () => {
            game._data.phase = 'da-ay';
            game.isDay.should.be.false;
        });
        it('should not be day for phase `night`', () => {
            game._data.phase = 'night';
            game.isDay.should.be.false;
        });
    });
    describe('getter isNight', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be night for phase `night`', () => {
            game._data.phase = 'night';
            game.isNight.should.be.true;
        });
        it('should be night for phase `NIGHT`', () => {
            game._data.phase = 'NIGHT';
            game.isNight.should.be.true;
        });
        it('should be night for phase `nighttime`', () => {
            game._data.phase = 'nighttime';
            game.isNight.should.be.true;
        });
        it('should be night for phase `tonight`', () => {
            game._data.phase = 'tonight';
            game.isNight.should.be.true;
        });
        it('should not be night for phase `knit`', () => {
            game._data.phase = 'knit';
            game.isNight.should.be.false;
        });
        it('should not be night for phase `day`', () => {
            game._data.phase = 'day';
            game.isNight.should.be.false;
        });
    });
    describe('getter livePlayers', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be empty array for no players', () => {
            game.livePlayers.should.eql([]);
        });
        it('should be generate new array for each access', () => {
            game.livePlayers.should.not.equal(game.livePlayers);
        });
        it('should be an array of `MafiaUser`s', () => {
            game._data.livePlayers = Array.apply(null, Array(20)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game.livePlayers.forEach((player) => player.should.be.an.instanceOf(MafiaUser));
        });
        it('should shuffle the array of `MafiaUser`s', () => {
            const numbers = Array.apply(null, Array(20)).map((_, i) => i);
            const expected = numbers.map((n) => `user${n}`).join(' ');
            game._data.livePlayers = numbers.map((n) => {
                return {
                    username: `user${n}`
                };
            });
            const firstResult = game.livePlayers.map(player => player.username).join(' ');
            firstResult.should.not.equal(expected);
            const secondResult = game.livePlayers.map(player => player.username).join(' ');
            secondResult.should.not.equal(firstResult);
        });
    });
    describe('getter deadPlayers', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be empty array for no players', () => {
            game.deadPlayers.should.eql([]);
        });
        it('should be generate new array for each access', () => {
            game.deadPlayers.should.not.equal(game.livePlayers);
        });
        it('should be an array of `MafiaUser`s', () => {
            game._data.deadPlayers = Array.apply(null, Array(20)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game.deadPlayers.forEach((player) => player.should.be.an.instanceOf(MafiaUser));
        });
        it('should shuffle the array of `MafiaUser`s', () => {
            const numbers = Array.apply(null, Array(20)).map((_, i) => i);
            const expected = numbers.map((n) => `user${n}`).join(' ');
            game._data.deadPlayers = numbers.map((n) => {
                return {
                    username: `user${n}`
                };
            });
            const firstResult = game.deadPlayers.map(player => player.username).join(' ');
            firstResult.should.not.equal(expected);
            const secondResult = game.deadPlayers.map(player => player.username).join(' ');
            secondResult.should.not.equal(firstResult);
        });
    });
    describe('getter allPlayers', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be empty array for no players', () => {
            game.allPlayers.should.eql([]);
        });
        it('should be an array of `MafiaUser`s', () => {
            game._data.deadPlayers = Array.apply(null, Array(10)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game._data.livePlayers = Array.apply(null, Array(10)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game.allPlayers.forEach((player) => player.should.be.an.instanceOf(MafiaUser));
        });
        it('should contain all players', () => {
            game._data.deadPlayers = Array.apply(null, Array(2)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game._data.livePlayers = Array.apply(null, Array(3)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            const players = game.allPlayers;
            players.length.should.equal(5);
        });

        it('should shuffle the array of `MafiaUser`s', () => {
            const numbers = Array.apply(null, Array(20)).map((_, i) => i);
            const expected = numbers.map((n) => `user${n}`).join(' ');
            game._data.deadPlayers = Array.apply(null, Array(10)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game._data.livePlayers = Array.apply(null, Array(10)).map((_, i) => {
                return {
                    username: `user${10 + i}`
                };
            });
            const firstResult = game.allPlayers.map(player => player.username).join(' ');
            firstResult.should.not.equal(expected);
            const secondResult = game.allPlayers.map(player => player.username).join(' ');
            secondResult.should.not.equal(firstResult);
        });
    });
    describe('getter moderators', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be empty array for no players', () => {
            game.moderators.should.eql([]);
        });
        it('should be generate new array for each access', () => {
            game.moderators.should.not.equal(game.moderators);
        });
        it('should be an array of `MafiaUser`s', () => {
            game._data.moderators = Array.apply(null, Array(20)).map((_, i) => {
                return {
                    username: `user${i}`
                };
            });
            game.moderators.forEach((player) => player.should.be.an.instanceOf(MafiaUser));
        });
        it('should shuffle the array of `MafiaUser`s', () => {
            const numbers = Array.apply(null, Array(20)).map((_, i) => i);
            const expected = numbers.map((n) => `user${n}`).join(' ');
            game._data.moderators = numbers.map((n) => {
                return {
                    username: `user${n}`
                };
            });
            const firstResult = game.moderators.map(player => player.username).join(' ');
            firstResult.should.equal(expected);
            const secondResult = game.moderators.map(player => player.username).join(' ');
            secondResult.should.equal(firstResult);
        });
    });
    describe('getter aliases', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should include game name', () => {
            const name = `name is the name ${Math.random()}`,
                thegame = new MafiaGame({
                    name: name
                });
            thegame.aliases.should.contain(name);
        });
        it('should include game topic', () => {
            const topicId = Math.random(),
                thegame = new MafiaGame({
                    topicId: topicId
                });
            thegame.aliases.should.contain(`t_${topicId}`);
        });
        it('should be generate new array for each access', () => {
            game.aliases.should.not.equal(game.aliases);
        });
    });
    describe('save()', () => {
        let game = null,
            dao = null;
        beforeEach(() => {
            dao = {
                save: sinon.stub().resolves()
            };
            game = new MafiaGame({}, dao);
        });
        it('should resolve to self', () => {
            return game.save().should.become(game);
        });
        it('should save via DAO', () => {
            return game.save().then(() => {
                dao.save.called.should.be.true;
            });
        });
        it('should reject when dao save rejects', () => {
            dao.save.rejects('E_BAD_THINGS');
            return game.save().should.be.rejectedWith('E_BAD_THINGS');
        });
    });
    describe('addPlayer()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves();
        });
        it('should save new user', () => {
            return game.addPlayer('foobar').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve to new user', () => {
            return game.addPlayer('foobar').then((user) => {
                user.should.be.an.instanceOf(MafiaUser);
            });
        });
        it('should create user as alive', () => {
            return game.addPlayer('foobar').then((user) => {
                user.isAlive.should.be.true;
            });
        });
        it('should create user as non-moderator', () => {
            return game.addPlayer('foobar').then((user) => {
                user.isModerator.should.be.false;
            });
        });
        it('should store user data in live players', () => {
            return game.addPlayer('foobar').then((user) => {
                game._data.livePlayers.foobar.should.be.ok;
                game._data.livePlayers.foobar.should.be.an('object');
                game._data.livePlayers.foobar.should.not.equal(user);
            });
        });
        it('should store user data via userslug', () => {
            return game.addPlayer('FOObar').then(() => {
                game._data.livePlayers.foobar.should.be.ok;
            });
        });
        it('should reject when living player already exists', () => {
            game._data.livePlayers.foobar = {};
            return game.addPlayer('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when living player already exists via userslug', () => {
            game._data.livePlayers.foobar = {};
            return game.addPlayer('fooBAR').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when dead player already exists', () => {
            game._data.deadPlayers.foobar = {};
            return game.addPlayer('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when dead player already exists via user slug', () => {
            game._data.deadPlayers.foobar = {};
            return game.addPlayer('fOoBaR').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when moderator already exists', () => {
            game._data.moderators.foobar = {};
            return game.addPlayer('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when moderator already exists via user slug', () => {
            game._data.moderators.foobar = {};
            return game.addPlayer('fOoBaR').should.be.rejectedWith('E_USER_EXIST');
        });
    });
    describe('addModerator()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves();
        });
        it('should save new mod', () => {
            return game.addModerator('foobar').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve to new user', () => {
            return game.addModerator('foobar').then((user) => {
                user.should.be.an.instanceOf(MafiaUser);
            });
        });
        it('should create user as alive', () => {
            return game.addModerator('foobar').then((user) => {
                user.isAlive.should.be.true;
            });
        });
        it('should create user as moderator', () => {
            return game.addModerator('foobar').then((user) => {
                user.isModerator.should.be.true;
            });
        });
        it('should store user data in live players', () => {
            return game.addModerator('foobar').then((user) => {
                game._data.moderators.foobar.should.be.ok;
                game._data.moderators.foobar.should.be.an('object');
                game._data.moderators.foobar.should.not.equal(user);
            });
        });
        it('should store user data via userslug', () => {
            return game.addModerator('FOObar').then(() => {
                game._data.moderators.foobar.should.be.ok;
            });
        });
        it('should reject when living player already exists', () => {
            game._data.livePlayers.foobar = {};
            return game.addModerator('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when living player already exists via userslug', () => {
            game._data.livePlayers.foobar = {};
            return game.addModerator('fooBAR').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when dead player already exists', () => {
            game._data.deadPlayers.foobar = {};
            return game.addModerator('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when dead player already exists via user slug', () => {
            game._data.deadPlayers.foobar = {};
            return game.addModerator('fOoBaR').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when moderator already exists', () => {
            game._data.moderators.foobar = {};
            return game.addModerator('foobar').should.be.rejectedWith('E_USER_EXIST');
        });
        it('should reject when moderator already exists via user slug', () => {
            game._data.moderators.foobar = {};
            return game.addModerator('fOoBaR').should.be.rejectedWith('E_USER_EXIST');
        });
    });
    describe('_getPlayer()', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should return null for no players', () => {
            chai.expect(game._getPlayer('foobar')).to.be.null;
        });
        it('should return null for null parameter', () => {
            game._data.livePlayers.null = {};
            chai.expect(game._getPlayer(null)).to.be.null;
        });
        it('should return living player', () => {
            const name = `nale${Math.random()}`;
            game._data.livePlayers[name.replace('.', '')] = {
                username: name
            };
            const player = game._getPlayer(name);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return living player via userslug', () => {
            const name = `nale${Math.random()}`;
            game._data.livePlayers[name.replace('.', '')] = {
                username: name
            };
            const player = game._getPlayer(name.toUpperCase());
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return living player for MafiaUser', () => {
            const name = `nale${Math.random()}`;
            game._data.livePlayers[name.replace('.', '')] = {
                username: name
            };
            const user = new MafiaUser({
                username: name
            });
            const player = game._getPlayer(user);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return dead player', () => {
            const name = `nale${Math.random()}`;
            game._data.deadPlayers[name.replace('.', '')] = {
                username: name
            };
            const player = game._getPlayer(name);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return dead player vi userslug', () => {
            const name = `nale${Math.random()}`;
            game._data.deadPlayers[name.replace('.', '')] = {
                username: name
            };
            const player = game._getPlayer(name.toUpperCase());
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return dead player for MafiaUser', () => {
            const name = `nale${Math.random()}`;
            game._data.deadPlayers[name.replace('.', '')] = {
                username: name
            };
            const user = new MafiaUser({
                username: name
            });
            const player = game._getPlayer(user);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should not return moderator', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            chai.expect(game._getPlayer(name)).to.be.null;
        });
        it('should not return moderator via user slug', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            chai.expect(game._getPlayer(name.toUpperCase())).to.be.null;
        });
        it('should mot return moderator for MafiaUser', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            const user = new MafiaUser({
                username: name
            });
            chai.expect(game._getPlayer(user)).to.be.null;
        });
    });
    describe('getModerator()', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should throw exception for no moderators', () => {
            const name = `nale${Math.random()}`;
            chai.expect(() => game.getModerator(name)).to.throw('E_MODERATOR_NOT_EXIST');
        });
        it('should return moderator user', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            const player = game.getModerator(name);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return moderator via userslug', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            const player = game.getModerator(name.toUpperCase());
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
        it('should return moderator for MafiaUser', () => {
            const name = `nale${Math.random()}`;
            game._data.moderators[name.replace('.', '')] = {
                username: name
            };
            const user = new MafiaUser({
                username: name
            });
            const player = game.getModerator(user);
            player.should.be.an.instanceOf(MafiaUser);
            player.username.should.equal(name);
        });
    });
    describe('getPlayer()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game._getPlayer = sinon.stub().returns({});
        });
        it('should pass input value to _getPlayer', () => {
            const name = `namename${Math.random()}`;
            game.getPlayer(name);
            game._getPlayer.calledWith(name).should.be.true;
        });
        it('should return value from _getPlayer', () => {
            const expected = {};
            game._getPlayer.returns(expected);
            game._getPlayer().should.equal(expected);
        });
        it('should throw when _getPlayer returns null', () => {
            game._getPlayer.returns(null);
            chai.expect(() => game.getPlayer()).to.throw('E_USER_NOT_EXIST');
        });
    });
    describe('killPlayer()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves();
        });
        it('should reject for no players', () => {
            return game.killPlayer('foobar').should.be.rejectedWith('E_USER_NOT_LIVE');
        });
        it('should reject for null player', () => {
            return game.killPlayer(null).should.be.rejectedWith('E_USER_NOT_LIVE');
        });
        it('should reject for dead player', () => {
            game._data.deadPlayers.foobar = {};
            return game.killPlayer('foobar').should.be.rejectedWith('E_USER_NOT_LIVE');
        });
        it('should reject for moderator', () => {
            game._data.moderators.foobar = {};
            return game.killPlayer('foobar').should.be.rejectedWith('E_USER_NOT_LIVE');
        });
        it('should resolve to killed player on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            game._data.livePlayers[name] = {
                username: name
            };
            return game.killPlayer(name).then((player) => {
                player.should.be.an.instanceOf(MafiaUser);
                player.username.should.equal(name);
                player.isAlive.should.be.false;
            });
        });
        it('should remove player from live players on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            const data = {
                username: name
            };
            game._data.livePlayers[name] = data;
            return game.killPlayer(name).then(() => {
                game._data.livePlayers.should.not.have.any.key(name);
            });
        });
        it('should add player to dead players on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            const data = {
                username: name
            };
            game._data.livePlayers[name] = data;
            return game.killPlayer(name).then(() => {
                game._data.deadPlayers.should.have.any.key(name);
                game._data.deadPlayers[name].should.equal(data);
            });
        });
        it('should save new data on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            game._data.livePlayers[name] = {
                username: name
            };
            return game.killPlayer(name).then(() => {
                game.save.called.should.be.true;
            });
        });
    });
    describe('resurectPlayer()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves();
        });
        it('should reject for no players', () => {
            return game.resurectPlayer('foobar').should.be.rejectedWith('E_USER_NOT_DEAD');
        });
        it('should reject for null player', () => {
            return game.resurectPlayer(null).should.be.rejectedWith('E_USER_NOT_DEAD');
        });
        it('should reject for live player', () => {
            game._data.livePlayers.foobar = {};
            return game.resurectPlayer('foobar').should.be.rejectedWith('E_USER_NOT_DEAD');
        });
        it('should reject for moderator', () => {
            game._data.moderators.foobar = {};
            return game.resurectPlayer('foobar').should.be.rejectedWith('E_USER_NOT_DEAD');
        });
        it('should resolve to killed player on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            game._data.deadPlayers[name] = {
                username: name
            };
            return game.resurectPlayer(name).then((player) => {
                player.should.be.an.instanceOf(MafiaUser);
                player.username.should.equal(name);
                player.isAlive.should.be.true;
            });
        });
        it('should remove player from dead players on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            const data = {
                username: name
            };
            game._data.deadPlayers[name] = data;
            return game.resurectPlayer(name).then(() => {
                game._data.deadPlayers.should.not.have.any.key(name);
            });
        });
        it('should add player to live players on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            const data = {
                username: name
            };
            game._data.deadPlayers[name] = data;
            return game.resurectPlayer(name).then(() => {
                game._data.livePlayers.should.have.any.key(name);
                game._data.livePlayers[name].should.equal(data);
            });
        });
        it('should save new data on success', () => {
            const name = `name${Math.floor(Math.random() * 1e7)}`;
            game._data.deadPlayers[name] = {
                username: name
            };
            return game.resurectPlayer(name).then(() => {
                game.save.called.should.be.true;
            });
        });
    });
    describe('nextPhase()', () => {
        let game = null;
        const phases = ['1', '2', '3', '4', '5', '6'];
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
            game._data.phases = phases;
            game._data.phase = phases[0];
        });
        [1, 2, 3, 4, 5].forEach((phase) => {
            it(`should increment from phase ${phase} to ${phase + 1}`, () => {
                game._data.phase = `${phase}`;
                return game.nextPhase().then(() => {
                    game.phase.should.equal(`${phase + 1}`);
                });
            });
        });
        it('should increment phase without incrementing day', () => {
            return game.nextPhase().then(() => {
                game.day.should.equal(1);
                game.phase.should.equal('2');
            });
        });
        it('should increment day after last phase of the day', () => {
            game._data.phase = '6';
            return game.nextPhase().then(() => {
                game.day.should.equal(2);
                game.phase.should.equal('1');
            });
        });
        it('should snap phase to beginning of next day on invalid phase', () => {
            game._data.phase = 'i like bananas';
            return game.nextPhase().then(() => {
                game.day.should.equal(2);
                game.phase.should.equal('1');
            });
        });
        it('should save results', () => {
            return game.nextPhase().then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve to self on success', () => {
            return game.nextPhase().should.become(game);
        });
    });
    describe('newDay()', () => {
        let game = null;
        const phases = ['1', '2', '3', '4', '5', '6'];
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
            game._data.phases = phases;
            game._data.phase = phases[0];
        });
        it('should increment day value', () => {
            game.day.should.equal(1);
            return game.newDay().then(() => {
                game.day.should.equal(2);
            });
        });
        it('should reset phase to beginning of day', () => {
            game._data.phase = '3';
            return game.newDay().then(() => {
                game.phase.should.equal('1');
            });
        });
        it('should save results', () => {
            return game.newDay().then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve to self on success', () => {
            return game.newDay().should.become(game);
        });
    });
    describe('getAction()', () => {
        let game = null,
            actions = null;
        beforeEach(() => {
            game = new MafiaGame({});
            actions = game._data.actions;
        });
        it('should return null when no action matches', () => {
            actions.push({
                actor: 'foo',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getAction('foobar')).to.be.null;
        });
        it('should return action when includeRevokedActions is set', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 50
            });
            game.getAction('foobar', undefined, undefined, undefined, undefined, true).should.be.an.instanceOf(MafiaAction);
        });
        it('should not return action when includeRevokedActions is unset', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 50
            });
            chai.expect(game.getAction('foobar', undefined, undefined, undefined, undefined, false)).to.be.null;
        });
        it('should return revoked action when  action matches', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 19
            });
            game.getAction('foobar').should.be.an.instanceOf(MafiaAction);
        });
        it('should return action when a action matches MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'foobar'
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote'
            });
            game.getAction(actor).should.be.an.instanceOf(MafiaAction);
        });
        it('should return first matching action when actions matches', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 1
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 2
            });
            game.getAction('foobar').token.should.equal(1);
        });
        it('should not choose action for non filter day', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getAction('foobar', undefined, undefined, undefined, 2)).to.be.null;
        });
        it('should not choose action for non filter actor', () => {
            actions.push({
                actor: 'foo',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getAction('foobar')).to.be.null;
        });
        it('should not choose action for non filter type', () => {
            actions.push({
                actor: 'foobar',
                day: 2,
                action: 'vote'
            });
            chai.expect(game.getAction('foobar', undefined, 'fish')).to.be.null;
        });
        it('should not choose action for non filter target', () => {
            actions.push({
                actor: 'foobar',
                target: 'hexadecimal',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getAction('foobar', 'ocatal')).to.be.null;
        });
        it('should not choose action for non filter action token', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 'abc'
            });
            chai.expect(game.getAction('foobar', undefined, undefined, 'cde')).to.be.null;
        });
    });
    describe('getActionOfType()', () => {
        let game = null,
            actions = null;
        beforeEach(() => {
            game = new MafiaGame({});
            actions = game._data.actions;
        });
        it('should return null when no action matches', () => {
            actions.push({
                actor: 'foo',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getActionOfType('foobar')).to.be.null;
        });
        it('should default action type to `vote`', () => {
            actions.push({
                actor: 'foo',
                day: 1,
                action: 'vote',
                token: 4
            });
            actions.push({
                actor: 'foo',
                day: 1,
                action: 'bar'
            });
            game.getActionOfType().token.should.equal(4);
        });
        it('should return action when includeRevokedActions is set', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 50
            });
            game.getActionOfType('vote', undefined, undefined, undefined, true).should.be.an.instanceOf(MafiaAction);
        });
        it('should not return action when includeRevokedActions is unset', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 50
            });
            chai.expect(game.getActionOfType('vote', undefined, undefined, undefined, false)).to.be.null;
        });
        it('should default includeRevokedActions to unset', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                revokedId: 50
            });
            chai.expect(game.getActionOfType('vote')).to.be.null;
        });
        it('should return latest matching action when actions matches', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 1
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 2
            });
            game.getActionOfType('vote').token.should.equal(2);
        });
        it('should return latest unrevoked matching action when actions matches', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 1
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 2
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 3,
                revokedId: 99
            });
            game.getActionOfType('vote').token.should.equal(2);
        });
        it('should not choose action for non filter day', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getActionOfType('vote', undefined, undefined, 2)).to.be.null;
        });
        it('should not choose action for non filter type', () => {
            actions.push({
                actor: 'foobar',
                day: 2,
                action: 'vote'
            });
            chai.expect(game.getActionOfType('fish')).to.be.null;
        });
        it('should not choose action for non filter target', () => {
            actions.push({
                actor: 'foobar',
                target: 'hexadecimal',
                day: 1,
                action: 'vote'
            });
            chai.expect(game.getActionOfType('vote', 'ocatal')).to.be.null;
        });
        it('should not choose action for non filter action token', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 'abc'
            });
            chai.expect(game.getActionOfType('vote', undefined, 'cde')).to.be.null;
        });
        it('should not choose action for non filter action token', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 'abc'
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 'def'
            });
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote',
                token: 'xyz'
            });
            chai.expect(game.getActionOfType('vote', undefined, 'def')).to.not.be.null;
        });
    });
    describe('getActions()', () => {
        let game = null,
            actions = null;
        const actors = ['foobar', 'accalia', 'sockbot'];
        beforeEach(() => {
            game = new MafiaGame({});
            actions = game._data.actions;
            actors.forEach((actor) => {
                actions.push({
                    actor: actor,
                    day: 1,
                    action: 'vote'
                });
            });
        });
        it('should return MafiaActions', () => {
            game._data.livePlayers.accalia = 1;
            game._data.livePlayers.sockbot = 1;
            game.getActions().forEach((action) => {
                action.should.be.an.instanceOf(MafiaAction);
            });
        });
        it('should return actions for living players', () => {
            game._data.livePlayers.accalia = 1;
            game._data.livePlayers.sockbot = 1;
            game.getActions().should.have.length(2);
        });
        it('should return all actions for current day', () => {
            game.getActions(undefined, undefined, true).should.have.length(3);
        });
        it('should return actions of requested type', () => {
            actions[2].action = 'oops';
            game._data.livePlayers.sockbot = 1;
            game.getActions('oops')[0].toJSON().should.eql({
                actor: 'sockbot',
                day: 1,
                action: 'oops',
                token: 'vote'
            });
        });
        it('should return actions of requested day', () => {
            actions[2].day = 7;
            game._data.livePlayers.sockbot = 1;
            game.getActions(undefined, 7)[0].toJSON().should.eql({
                actor: 'sockbot',
                day: 7,
                action: 'vote',
                token: 'vote'
            });
        });
    });
    describe('registerAction()', () => {
        let game = null,
            actions = null;
        beforeEach(() => {
            game = new MafiaGame({
                livePlayers: {
                    accalia: {
                        username: 'accalia'
                    },
                    fred: {
                        username: 'fred'
                    }
                }
            });
            game.save = sinon.stub().resolves(game);
            actions = game._data.actions;
        });
        it('should add action to action list', () => {
            actions.should.have.length(0);
            return game.registerAction(4, 'accalia', 'fred', 'vote', 'boo').then(() => {
                actions.should.have.length(1);
            });
        });
        it('should store raw data in action list', () => {
            return game.registerAction(4, 'accalia', 'fred', 'vote', 'boo').then(() => {
                actions[0].should.not.be.an.instanceOf(MafiaAction);
            });
        });
        it('should resolve to created action', () => {
            return game.registerAction(4, 'accalia', 'fred', 'vote', 'boo').then((action) => {
                action.should.be.an.instanceOf(MafiaAction);
            });
        });
        it('should register actor by userslug', () => {
            return game.registerAction(4, 'AcCaLiA', 'fred', 'vote', 'boo').then(() => {
                actions[0].actor.should.equal('accalia');
            });
        });
        it('should register target by userslug', () => {
            return game.registerAction(4, 'accalia', 'FreD', 'vote', 'boo').then(() => {
                actions[0].target.should.equal('fred');
            });
        });
        it('should register action against non-living target', () => {
            return game.registerAction(4, 'accalia', 'barney', 'vote', 'boo').then(() => {
                actions[0].target.should.equal('barney');
            });
        });
        it('should register action against null target', () => {
            return game.registerAction(4, 'accalia', null, 'vote', 'boo').then(() => {
                chai.expect(actions[0].target).to.equal(null);
            });
        });
        it('should register action of custom type', () => {
            const expected = `action${Math.random()}`;
            return game.registerAction(4, 'accalia', null, expected, 'boo').then(() => {
                chai.expect(actions[0].action).to.equal(expected);
            });
        });
        it('should register action of default type', () => {
            return game.registerAction(4, 'accalia', null, undefined, 'boo').then(() => {
                chai.expect(actions[0].action).to.equal('vote');
            });
        });
        it('should register action of custom token', () => {
            const expected = `action${Math.random()}`;
            return game.registerAction(4, 'accalia', null, 'vote', expected).then(() => {
                chai.expect(actions[0].token).to.equal(expected);
            });
        });
        it('should register action of default type', () => {
            return game.registerAction(4, 'accalia', null, 'vote').then(() => {
                chai.expect(actions[0].token).to.equal('vote');
            });
        });
        it('should save after adding action', () => {
            return game.registerAction(4, 'accalia', null).then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should revoke prior action', () => {
            actions.push({
                day: 1,
                action: 'vote',
                actor: 'accalia',
                target: 'wilma'
            });
            return game.registerAction(4, 'accalia', 'barney').then(() => {
                actions.should.have.length(2);
                actions[0].revokedId.should.equal(4);
                actions[0].target.should.equal('wilma');
                actions[1].target.should.equal('barney');
            });
        });
        it('should register action with same type and different token', () => {
            actions.push({
                day: 1,
                action: 'vote',
                actor: 'accalia',
                target: 'wilma'
            });
            return game.registerAction(4, 'accalia', 'barney', 'vote', 'fubar').then(() => {
                actions.should.have.length(2);
                chai.expect(actions[0].revokedId).to.be.undefined;
                actions[0].target.should.equal('wilma');
                actions[1].target.should.equal('barney');
            });
        });
        it('should require actor to be alive', () => {
            return game.registerAction(4, 'jack_skelleton', 'barney', 'vote', 'fubar').should.be.rejectedWith('E_ACTOR_NOT_ALIVE');
        });
    });
    describe('revokeAction()', () => {
        let game = null,
            actions = null;
        const actors = ['foobar', 'accalia', 'sockbot'];
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves();
            actions = game._data.actions;
            actors.forEach((actor) => {
                game._data.livePlayers[actor] = {
                    username: actor
                };
                actions.push({
                    actor: actor,
                    day: 1,
                    action: 'vote'
                });
            });
        });
        it('should revoke action for userslug', () => {
            return game.revokeAction(100, 'accalia').then((action) => {
                action.isCurrent.should.be.false;
            });
        });
        it('should revoke action for userslug', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            return game.revokeAction(100, actor).then((action) => {
                action.isCurrent.should.be.false;
            });
        });
        it('should store revocation post id in action', () => {
            return game.revokeAction(101, 'accalia').then((action) => {
                action.revokedId.should.equal(101);
            });
        });
        it('should store revocation post id in action for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            return game.revokeAction(101, actor).then((action) => {
                action.revokedId.should.equal(101);
            });
        });
        it('should store revocation post id in game', () => {
            return game.revokeAction(102, 'accalia').then(() => {
                actions[1].revokedId.should.equal(102);
            });
        });
        it('should store revocation post id in game for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            return game.revokeAction(102, actor).then(() => {
                actions[1].revokedId.should.equal(102);
            });
        });
        it('should save state after revocation', () => {
            return game.revokeAction(103, 'accalia').then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should save state after revocation for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            return game.revokeAction(103, actor).then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve for revoking non action', () => {
            return game.revokeAction(103, 'accalia', 'nobody').should.be.fulfilled;
        });
        it('should resolve for revoking non action for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            return game.revokeAction(103, actor, 'nobody').should.be.fulfilled;
        });
        it('should resolve without saving for revoking revoked action', () => {
            actions[1].revokedId = 52;
            return game.revokeAction(103, 'accalia').then(() => {
                game.save.called.should.be.false;
            });
        });
        it('should resolve without saving for revoking revoked action for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            actions[1].revokedId = 52;
            return game.revokeAction(103, actor).then(() => {
                game.save.called.should.be.false;
            });
        });
        it('should resolve for revoking revoked action', () => {
            actions[1].revokedId = 52;
            return game.revokeAction(103, 'accalia').should.be.fulfilled;
        });
        it('should resolve for revoking revoked action for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            actions[1].revokedId = 52;
            return game.revokeAction(103, actor).should.be.fulfilled;
        });
        it('should resolve without saving for revoking revoked action', () => {
            actions[1].revokedId = 52;
            return game.revokeAction(103, 'accalia').then(() => {
                game.save.called.should.be.false;
            });
        });
        it('should resolve without saving for revoking revoked action for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            actions[1].revokedId = 52;
            return game.revokeAction(103, actor).then(() => {
                game.save.called.should.be.false;
            });
        });
        it('should not allow revoking the actions of the dead', () => {
            game._data.livePlayers = [];
            return game.revokeAction(103, 'accalia').should.be.rejectedWith('E_ACTOR_NOT_ALIVE');
        });
        it('should not allow revoking the actions of the dead for MafiaUser', () => {
            const actor = new MafiaUser({
                username: 'ACCALIA'
            });
            game._data.livePlayers = [];
            return game.revokeAction(103, actor).should.be.rejectedWith('E_ACTOR_NOT_ALIVE');
        });
        it('should revoke action target', () => {
            actions.push({
                actor: 'accalia',
                day: 1,
                action: 'vote',
                target: 'boxer'
            });
            return game.revokeAction(103, 'accalia', 'boxer').then(() => {
                chai.expect(actions[1].revokedId).to.be.undefined;
                actions[3].revokedId.should.equal(103);
            });
        });
        it('should revoke action type', () => {
            actions.push({
                actor: 'accalia',
                day: 1,
                action: 'boxer'
            });
            return game.revokeAction(103, 'accalia', undefined, 'boxer').then(() => {
                chai.expect(actions[1].revokedId).to.be.undefined;
                actions[3].revokedId.should.equal(103);
            });
        });
        it('should revoke action token', () => {
            actions.push({
                actor: 'accalia',
                day: 1,
                action: 'vote',
                token: 'boxer'
            });
            return game.revokeAction(103, 'accalia', undefined, undefined, 'boxer').then(() => {
                chai.expect(actions[1].revokedId).to.be.undefined;
                actions[3].revokedId.should.equal(103);
            });
        });
    });
    describe('getValue()', () => {
        let game = null,
            values = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
            values = game._data.values;
        });
        it('should return undefined for unknown key', () => {
            const name = `keykey${Math.random()}`;
            values.should.not.have.any.key(name);
            chai.expect(game.getValue(name)).to.be.undefined;
        });
        it('should return saved value for key', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            values[name] = expected;
            game.getValue(name).should.equal(expected);
        });
    });
    describe('setValue()', () => {
        let game = null,
            values = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
            values = game._data.values;
        });
        it('should set value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            return game.setValue(name, expected).then(() => {
                values[name].should.equal(expected);
            });
        });
        it('should save new value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            return game.setValue(name, expected).then(() => {
                game.save.called.should.be.true;
            });
        });
        it('should resolve to overridden value', () => {
            const name = `keykey${Math.random()}`;
            const expected = `valuevalue${Math.random()}`;
            values[name] = expected;
            return game.setValue(name, 'foobar').then((oldvalue) => {
                oldvalue.should.equal(expected);
            });
        });
    });
    describe('addAlias()', () => {
        let game = null,
            getGameByAlias = null;
        beforeEach(() => {
            getGameByAlias = sinon.stub().resolves();
            game = new MafiaGame({}, {
                getGameByAlias: getGameByAlias
            });
            game.save = sinon.stub().resolves(game);
        });
        it('should resolve when alias already owned by game', () => {
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.addAlias(alias).then(() => {
                getGameByAlias.should.not.be.called;
            });
        });
        it('should resolve to self when alias already owned by game', () => {
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.addAlias(alias).should.become(game);
        });
        it('should resolve when case safe alias already owned by game', () => {
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.addAlias(alias.toUpperCase()).then(() => {
                getGameByAlias.should.not.be.called;
            });
        });
        it('should resolve to self when case safe alias already owned by game', () => {
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.addAlias(alias.toUpperCase()).should.become(game);
        });
        it('should reject when alias has already been assigned to another game', () => {
            getGameByAlias.resolves({});
            game.addAlias(`cthulu4prez${Math.random()}`).should.be.rejectedWith('E_ALIAS_EXISTS');
        });
        it('should reject when getGameByAlias rejects with non E_NO_GAME reason', () => {
            getGameByAlias.rejects('E_DIRTY_DIRTY_GIRL');
            return game.addAlias('foobar').should.be.rejected;
        });
        it('should add alias to aliases list when aliase is available', () => {
            getGameByAlias.rejects('E_NO_GAME');
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.should.not.contain(alias);
            return game.addAlias(alias).then(() => {
                game._data.aliases.should.contain(alias);
                game.save.should.be.calledOnce;
            });
        });
        it('should add case safe alias to aliases list when aliase is available', () => {
            getGameByAlias.rejects('E_NO_GAME');
            const alias = `sekret name ${Math.random()}`;
            game._data.aliases.should.not.contain(alias);
            return game.addAlias(alias.toUpperCase()).then(() => {
                game._data.aliases.should.contain(alias);
                game.save.should.be.calledOnce;
            });
        });
    });
    describe('removeAlias()', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
        });
        it('should resolve to false when alias is not owned by game', () => {
            const alias = `some alias ${Math.random()}`;
            return game.removeAlias(alias).should.become(false);
        });
        it('should not save when alias is not owned by game', () => {
            const alias = `some alias ${Math.random()}`;
            return game.removeAlias(alias).then(() => {
                game.save.should.not.be.called;
            });
        });
        it('should resolve to true when alias is owned by game', () => {
            const alias = `some alias ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.removeAlias(alias).should.become.true;
        });
        it('should save when alias is owned by game', () => {
            const alias = `some alias ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.removeAlias(alias).then(() => {
                game.save.should.be.called;
            });
        });
        it('should remove alias from game', () => {
            const alias = `some alias ${Math.random()}`;
            game._data.aliases.push(alias);
            return game.removeAlias(alias).then(() => {
                game._data.aliases.should.not.contain(alias);
            });
        });
    });
    describe('alias proxies', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.addAlias = sinon.stub().resolves();
            game.removeAlias = sinon.stub().resolves(false);
        });
        it('should alias `addTopic()` to `addAlias()`', () => {
            const topic = Math.random(),
                expected = Math.random();
            game.addAlias.resolves(expected);
            return game.addTopic(topic).then((actual) => {
                actual.should.equal(expected);
                game.addAlias.should.be.calledWith(`t_${topic}`).once;
            });
        });
        it('should alias `addChat()` to `addAlias()`', () => {
            const chat = Math.random(),
                expected = Math.random();
            game.addAlias.resolves(expected);
            return game.addChat(chat).then((actual) => {
                actual.should.equal(expected);
                game.addAlias.should.be.calledWith(`c_${chat}`).once;
            });
        });
        it('should alias `removeTopic()` to `removeAlias()`', () => {
            const topic = Math.random(),
                expected = Math.random();
            game.removeAlias.resolves(expected);
            return game.removeTopic(topic).then((actual) => {
                actual.should.equal(expected);
                game.removeAlias.should.be.calledWith(`t_${topic}`).once;
            });
        });
        it('should alias `removeChat()` to `removeAlias()`', () => {
            const chat = Math.random(),
                expected = Math.random();
            game.removeAlias.resolves(expected);
            return game.removeChat(chat).then((actual) => {
                actual.should.equal(expected);
                game.removeAlias.should.be.calledWith(`c_${chat}`).once;
            });
        });
    });
    describe('setActive', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
        });
        it('should set inactive game to active', () => {
            game._data.isActive = false;
            return game.setActive().then(() => {
                game._data.isActive.should.be.true;
            });
        });
        it('should set active game to active', () => {
            game._data.isActive = true;
            return game.setActive().then(() => {
                game._data.isActive.should.be.true;
            });
        });
        it('should resolve to self', () => {
            return game.setActive().should.become(game);
        });
        it('should call game.save() to save changes', () => {
            return game.setActive().then(() => {
                game.save.should.be.called;
            });
        });
    });
    describe('setActive', () => {
        let game = null;
        beforeEach(() => {
            game = new MafiaGame({});
            game.save = sinon.stub().resolves(game);
        });
        it('should set inactive game to inactive', () => {
            game._data.isActive = false;
            return game.setInactive().then(() => {
                game._data.isActive.should.be.false;
            });
        });
        it('should set active game to inactive', () => {
            game._data.isActive = true;
            return game.setInactive().then(() => {
                game._data.isActive.should.be.false;
            });
        });
        it('should resolve to self', () => {
            return game.setInactive().should.become(game);
        });
        it('should call game.save() to save changes', () => {
            return game.setInactive().then(() => {
                game.save.should.be.called;
            });
        });
    });
    describe('toJSON()', () => {
        it('should return internal data store', () => {
            const data = {};
            const game = new MafiaGame(data);
            game.toJSON().should.equal(data);
        });
    });
});
