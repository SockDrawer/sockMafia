'use strict';
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
        data.isDay = data.isDay || true;
        data.isActive = data.isActive || false;
        data.livePlayers = data.livePlayers || {};
        data.deadPlayers = data.deadPlayers || {};
        data.moderators = data.moderators || [];
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
    get isDay() {
        return this._data.isDay;
    }
    get isNight() {
        return !this._data.isDay;
    }
    get isActive() {
        return this._data.isActive;
    }
    get livePlayers() {
        const players = Object.keys(this._data.livePlayers);
        shuffle(players);
        return players.map((player) => this._data.livePlayers[player]);
    }
    get deadPlayers() {
        const players = Object.keys(this._data.deadPlayers);
        shuffle(players);
        return players.map((player) => this._data.deadPlayers[player]);
    }
    get moderators() {
        return this._data.moderators;
    }
    toJSON() {
        return this._data;
    }
}

module.exports = MafiaGame;
