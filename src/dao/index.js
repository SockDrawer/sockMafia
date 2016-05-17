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
            this._data = data;
            const game = new MafiaGame({
                topicId: topicId,
                name: name
            }, this);
            this._data.push(game);
            return this.save().then(() => game);
        });
    }
    load() {
        if (this._data) {
            return Promise.resolve(this._data);
        }
        return readData(this.connection);
    }
    save() {
        return saveData(this.connection, this);
    }
    toJSON() {
        return this._data;
    }
}



console.log(JSON.stringify(new MafiaDao()));
const dao = new MafiaDao('./dao/mafia.json');
dao.createGame(45).then((data) => console.log(data)).catch((err) => console.error(err));