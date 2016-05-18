'use strict';

const fs = require('fs');

const MafiaGame = require('./mafiaGame');

function readData(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return resolve([]); // empty list of games
                }
                return reject(err);
            }
            try {
                return resolve(JSON.parse(data || '[]'));
            } catch (err2) {
                reject(err2);
            }
        });
    });
}

function saveData(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(data, null, '\t'), 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}

class MafiaDao {
    constructor(connection) {
        this.connection = connection;
        this._data = null;
    }
    createGame(topicId, name) {
        return this.load().then((data) => {
            const conflicts = data.filter((candidate) => {
                return candidate.topicId === topicId || candidate.name === name;
            });
            if (conflicts.length !== 0) {
                return Promise.reject('E_GAME_EXISTS');
            }
            const game = new MafiaGame({
                topicId: topicId,
                name: name
            }, this);
            this._data.push(game);
            return this.save().then(() => game);
        });
    }
    getGameByTopicId(topicId) {
        return this.load().then((data) => {
            const game = data.filter((candidate) => candidate.topicId === topicId)[0];
            if (!game) {
                return Promise.reject('E_NO_GAME');
            }
            return new MafiaGame(game, this);
        });
    }
    getGameByName(name) {
        return this.load().then((data) => {
            const game = data.filter((candidate) => candidate.name === name)[0];
            if (!game) {
                return Promise.reject('E_NO_GAME');
            }
            return new MafiaGame(game, this);
        });
    }
    load() {
        if (this._data) {
            return Promise.resolve(this._data);
        }
        return readData(this.connection)
            .then((data) => {
                this._data = data;
                return data;
            });
    }
    save() {
        return saveData(this.connection, this);
    }
    toJSON() {
        return this._data;
    }
}

module.exports = MafiaDao;

/* "debugging"
const dao = new MafiaDao('./dao/mafia.json');
dao.getGameByTopicId(45)
    .then((game) => game.nextPhase())
    .then((data) => console.log(data)).catch((err) => console.error(err));
    */
