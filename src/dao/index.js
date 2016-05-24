'use strict';
/**
 * sockMafia DAO Provider
 * @module sockmafia.src.dao.MafiaDao
 * @author Accalia
 * @license MIT
 */
const fs = require('fs');

const MafiaGame = require('./mafiaGame');

/**
 * Read a serialized mafia configuration from disk and resolve to deserialized contents
 * 
 * Assumes an ENOENT error on read is okay and resolves to the empty array in this case.
 * 
 * @param {string} filename Filename to read
 * @returns {Promise<Array>} Resolves to the deserialized mafia configurations. Rejects on read or parse error.
 */
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

/**
 * Save serialized data to disk
 * 
 * @param {string} filename Filename to write
 * @param {*} data Data to serialize and write
 * @returns {Promise} Resolves when data has been written, rejects on serialization or file access error
 */
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

/**
 * MafiaDao Class
 *
 */
class MafiaDao {
    /**
     * MafiaDao constructor. Creates a new MafiaDao instance
     *
     * @param {string} connection File Path of the data store this dao will use
     */
    constructor(connection) {
        this.connection = connection;
        this._data = null;
    }

    /**
     * Create a new MafiaGame and store it in this DAO
     *
     * @param {number} topicId Game topic
     * @param {string} [name] Custom name for the game
     * @returns {Promise<MafiaGame>} Resolves to created game, rejects if preconditions or save state fails
     */
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
            this._data.push(game._data);
            return this.save().then(() => game);
        });
    }

    /**
     * Retrieve a previously created game by topicId
     *
     * @param {number} topicId Game Topic identifier
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByTopicId(topicId) {
        return this.load().then((data) => {
            const game = data.filter((candidate) => candidate.topicId === topicId)[0];
            if (!game) {
                return Promise.reject('E_NO_GAME');
            }
            return new MafiaGame(game, this);
        });
    }

    /**
     * Retrieve a previously created game by topicId
     *
     * @param {string} name Custom game name
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByName(name) {
        return this.load().then((data) => {
            const game = data.filter((candidate) => candidate.name === name)[0];
            if (!game) {
                return Promise.reject('E_NO_GAME');
            }
            return new MafiaGame(game, this);
        });
    }

    /**
     * Load data from disk, once.
     *
     * Cache read results to remove need to fetch from disk multiple times
     * 
     * @returns {Promise<Array>} Resolves to read data, rejects on read error
     */
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

    /**
     * Save DAO Data to disk
     *
     * @returns {Promise} Resolves when data has been written to disk, rejects wehn write error occurs
     */
    save() {
        return saveData(this.connection, this);
    }

    /**
     * Create a serializeable representation of the DAO object.
     *
     * @returns {object} A serializeable clone of this dao's internal data store.
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this._data));
    }
}
module.exports = MafiaDao;
