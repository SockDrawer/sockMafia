'use strict';

const MafiaUser = require('./mafiaUser')

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const idx = Math.floor(Math.random() * (i + 1));
        const val = arr[idx];
        arr[idx] = arr[i];
        arr[i] = val;
    }
    return arr;
}

class MafiaGame {
    constructor(data, dao) {
        data.name = data.name || `mafia_${data.topicId}`;
        data.day = data.day || 1;
        data.phases = data.phases || ['day', 'night'];
        data.phase = data.phase || data.phases[0];
        data.isActive = data.isActive !== undefined ? data.isActive : true;
        data.livePlayers = data.livePlayers || {};
        data.deadPlayers = data.deadPlayers || {};
        data.moderators = data.moderators || {};
        this._data = data;
        this._dao = dao;
    }
    get topicId() {
        return this.data.topicId;
    }
    get name() {
        return this._data.name;
    }
    get day() {
        return this._data.day;
    }
    get phase() {
        return this._data.phase;
    }
    get isDay() {
        return this._data.phase === 'day';
    }
    get isNight() {
        return this._data.phase === 'night';
    }
    get isActive() {
        return this._data.isActive;
    }
    get livePlayers() {
        const players = Object.keys(this._data.livePlayers);
        shuffle(players);
        return players.map((player) => new MafiaUser(this._data.livePlayers[player], this));
    }
    get deadPlayers() {
        const players = Object.keys(this._data.deadPlayers);
        shuffle(players);
        return players.map((player) => new MafiaUser(this._data.deadPlayers[player], this));
    }
    get moderators() {
        return this._data.moderators.map((player) => new MafiaUser(this._data.moderators[player], this));
    }
    save() {
        return this._dao.save().then(() => this);
    }
    addPlayer(username) {
        const user = new MafiaUser({
            username: username
        }, this);
        const livingConflict = this._data.livePlayers[user.userslug];
        const deadConflict = this._data.deadPlayers[user.userslug];
        if (livingConflict || deadConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.livePlayers[user.userslug] = user;
        return this.save().then(() => user);
    }
    addModerator(username) {
        const moderator = new MafiaUser({
            username: username,
            isModerator: true
        }, this);
        const livingConflict = this._data.moderators[moderator.userslug];
        if (livingConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.moderators[moderator.userslug] = moderator;
        return this.save().then(() => moderator);
    }
    getPlayer(user) {
        if (!(user instanceof MafiaUser)) {
            user = new MafiaUser({
                username: user
            }, this);
        }
        if (this._data.livePlayers[user.userslug]) {
            const player = new MafiaUser(this._data.livePlayers[user.userslug], this);
            return Promise.resolve(player);
        }
        if (this._data.deadPlayers[user.userslug]) {
            const player = new MafiaUser(this._data.deadPlayers[user.userslug], this);
            return Promise.resolve(player);
        }
        return Promise.reject('E_USER_NO_EXIST');
    }
    killPlayer(user) {
        if (!(user instanceof MafiaUser)) {
            user = new MafiaUser({
                username: user
            }, this);
        }
        if (this._data.livePlayers[user.userslug]) {
            const player = new MafiaUser(this._data.livePlayers[user.userslug], this);
            player.isAlive = false;
            delete this._data.livePlayers[player.userslug];
            this._data.deadPlayers[player.userslug] = player;
            return this.save().then(() => player);
        }
        return Promise.reject('E_USER_NOT_LIVE');
    }
    resurectPlayer(user) {
        if (!(user instanceof MafiaUser)) {
            user = new MafiaUser({
                username: user
            }, this);
        }
        if (this._data.deadPlayers[user.userslug]) {
            const player = new MafiaUser(this._data.deadPlayers[user.userslug], this);
            player.isAlive = true;
            delete this._data.deadPlayers[player.userslug];
            this._data.livePlayers[player.userslug] = player;
            return this.save().then(() => player);
        }
        return Promise.reject('E_USER_NOT_DEAD');
    }
    nextPhase() {
        const idx = this._data.phases.indexOf(this._data.phase);
        const newPhase = this._data.phases[idx + 1];
        if (!newPhase) {
            this._data.day += 1;
            this._data.phase = this._data.phases[0];
        } else {
            this._data.phase = newPhase;
        }
        return this.save();
    }
    newDay() {
        this._data.day += 1;
        this._data.phase = this._data.phases[0];
        return this.save();
    }
    toJSON() {
        return this._data;
    }
}

module.exports = MafiaGame;
