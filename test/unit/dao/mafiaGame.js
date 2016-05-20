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
    describe('getter moderators', () => {
        let game = null;
        beforeEach(() => game = new MafiaGame({}));
        it('should be empty array for no players', () => {
            game.moderators.should.eql([]);
        });
        it('should be generate new array for each access', () => {
            game.moderators.should.not.equal(game.livePlayers);
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
        it('should return action when a action matches', () => {
            actions.push({
                actor: 'foobar',
                day: 1,
                action: 'vote'
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
            game.getActions('oops').should.eql([{
                actor: 'sockbot',
                day: 1,
                action: 'oops'
            }]);
        });
        it('should return actions of requested day', () => {
            actions[2].day = 7;
            game._data.livePlayers.sockbot = 1;
            game.getActions(undefined, 7).should.eql([{
                actor: 'sockbot',
                day: 7,
                action: 'vote'
            }]);
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
        it('should store revocation post id in action', () => {
            return game.revokeAction(101, 'accalia').then((action) => {
                action.revokedId.should.equal(101);
            });
        });
        it('should store revocation post id in game', () => {
            return game.revokeAction(102, 'accalia').then(() => {
                actions[1].revokedId.should.equal(102);
            });
        });
        it('should save state after revocation', () => {
            return game.revokeAction(103, 'accalia').then(() => {
                game.save.called.should.be.true;
            });
        });
    });
});
