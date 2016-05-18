'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
chai.use(require('chai-as-promised'));

chai.should();

const fs = require('fs');

const MafiaGame = require('../../src/dao/mafiaGame'),
    MafiaAction = require('../../src/dao/mafiaAction'),
    MafiaUser = require('../../src/dao/mafiaUser');

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
    describe('addPlayer', () => {
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
        it('should store user data in live players', () => {
            return game.addPlayer('foobar').then((user) => {
                console.log(game._data.livePlayers);
                game._data.livePlayers.foobar.should.be.ok;
                game._data.livePlayers.foobar.should.be.an('object');
                game._data.livePlayers.foobar.should.not.equal(user);
            });
        });
        it('should reject when living player already exists', () => {

        })
    });
});
