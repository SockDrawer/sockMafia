'use strict';
/**
 * sockMafia DAO Provider
 * @module sockmafia.src.dao.MafiaDao
 * @author Accalia
 * @license MIT
 */
const fs = require('fs');

const MafiaGame = require('./mafiaGame');
const debug = require('debug')('sockbot:mafia:dao');

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
    if (filename === ':memory:') {
        return Promise.resolve(data);
    }
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
     * @namespace
     * @name addGameData
     * @property {string}               name            Name of the Game to add
     * @property {Topic|number}         topic           Topic the Game will be played in
     * @property {User|User[]|string[]} players         Initial players of the Game
     * @property {User|User[]|string[]} moderators      Initial moderators of the Game
     * @property {string[]}             [phases]        Phases of day that the Game will proceed through
     * @property {string}               [startPhase]    Start Phase of Day
     * @property {number}               [startDay]      Start day of the game
     */

    /**
     * Create a new MafiaGame and store it in this DAO
     *
     * @param {addGameData} gameData Data of the game to create
     * @returns {Promise<MafiaGame>} Resolves to created game, rejects if preconditions or save state fails
     */
    addGame(gameData) {
        let game;
        return this.load()
            .then((data) => {
                debug('Creating game from data object');
                const topic = typeof gameData.topic === 'number' ? gameData.topic : gameData.topic.id;
                game = new MafiaGame({
                    name: gameData.name,
                    topicId: topic,
                    phases: gameData.phases,
                    phase: gameData.startPhase,
                    day: gameData.startDay
                }, this);
                const conflicts = data.filter((candidate) => {
                    return candidate.topicId === game.topicId || candidate.name === game.name;
                });
                if (conflicts.length !== 0) {
                    debug('Game already exists!');
                    throw new Error('E_GAME_EXISTS');
                }
                this._data.push(game._data);
                debug(`Created game with ID ${game.id} and name ${game.name}`);
            })
            .then(this.save)
            .then(() => {
                const mods = Array.isArray(gameData.moderators) ? gameData.moderators : [gameData.moderators];
                return Promise.all(mods.map((mod) => {
                    const modName = typeof mod === 'string' ? mod : mod.username;
                    return game.addModerator(modName)
                        .catch((e) => {
                            throw new Error(`Cannot add ${modName} as moderator: ${e.message || e}`);
                        });
                }));
            })
            .then(() => {
                const players = Array.isArray(gameData.players) ? gameData.players : [gameData.players];
                return Promise.all(players.map((player) => {
                    const playerName = typeof player === 'string' ? player : player.username;
                    return game.addPlayer(playerName)
                        .catch((e) => {
                            throw new Error(`Cannot add ${playerName} as player: ${e.message || e}`);
                        });
                }));
            })
            .then(() => game, (rejection) => {
                this._data = this._data.filter((e) => e.id !== game.id);
                return this.save().then(() => {
                    throw rejection;
                });
            });
    }



    /**
     * Create a new MafiaGame and store it in this DAO
     *
     * @param {number} topicId Game topic. Must be an integer
     * @param {string} [name] Custom name for the game
     * @param {boolean} [active=true] Start the game in this active state
     * @returns {Promise<MafiaGame>} Resolves to created game, rejects if preconditions or save state fails
     */
    createGame(topicId, name, active) {
        return this.load().then((data) => {
            debug('Creating game');
            //Force number coercsion
            topicId = parseInt(topicId, 10);
            const conflicts = data.filter((candidate) => {
                return candidate.topicId === topicId || candidate.name === name;
            });
            if (conflicts.length !== 0) {
                debug('Game already exists!');
                return Promise.reject('E_GAME_EXISTS');
            }
            const game = new MafiaGame({
                topicId: topicId,
                name: name,
                isActive: active
            }, this);
            this._data.push(game._data);
            debug(`Created game with topic ID ${topicId} and name ${name}`);

            return this.save().then(() => game);
        });
    }

    /**
     * Retrieve a previously created game by topicId or name
     *
     * @param {number|string} game Game identifier.
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGame(game) {
        return this.getGameByTopicId(game).catch((err) => {
            if (err.message !== 'E_NO_GAME') {
                throw err;
            }
            return this.getGameByName(game);
        });
    }

    /**
     * Retrieve a previously created game by topicId
     *
     * @param {number} topicId Game Topic identifier. Must be an integer
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByTopicId(topicId) {
        return this.getGameByAlias(`t_${topicId}`);
    }

    /**
     * Retrieve a previously created game by chatId
     *
     * @param {number} chatId Chat identifier. Must be an integer
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByChatId(chatId) {
        return this.getGameByAlias(`c_${chatId}`);
    }

    /**
     * Retrieve a previously created game by topicId
     *
     * @param {string} name Custom game name
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByName(name) {
        return this.getGameByAlias(name);
    }

    /**
     * Retrieve a previously created game by alias
     *
     * @param {string} alias Custom game alias
     * @returns {Promise<MafiaGame>} Resolves to requested game, rejects when read error occurs or game not found
     */
    getGameByAlias(alias) {
        alias = alias.toLowerCase();
        return this.load().then((data) => {
            debug(`Searching for game by alias ${alias}`);
            const game = data.filter((candidate) => candidate.aliases.some((gamealias) => gamealias === alias))[0];
            if (!game) {
                debug('No game found!');
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
