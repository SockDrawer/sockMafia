'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.game
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:game');

/**
 * @namespace
 * @name addGameData
 * @property {string}               name            Name of the Game to add
 * @property {Number|Topic}         topic           Topic the Game will be played in
 * @property {User|User[]|string[]} players         Initial players of the Game
 * @property {User|User[]|string[]} moderators      Initial moderators of the Game
 * @property {string[]}             [phases]        Phases of day that the Game will proceed through
 * @property {string}               [startPhase]    Start Phase of Day
 * @property {number}               [startDay]      Start day of the game
 */


exports.bindForum = (forum, dao) => {
    class Game {
        /**
         * Create a new Mafia Game
         *
         * @param {createGameData} gameData - Information nexessary to create the game.
         * @returns {Promise<GameIdentifier>} Resolves to the id of the created game, rejects if game creation fails.
         */
        static createGame(gameData) {
            return new Promise((resolve) => {
                    if (typeof gameData !== 'object' || gameData === null) {
                        throw new Error('E_INVALID_GAME_DATA');
                    }
                    if (typeof gameData.name !== 'string' || gameData.name.length < 1) {
                        throw new Error('E_INVALID_GAME_DATA: MISSING_NAME');
                    }
                    if (!(gameData.topic instanceof forum.Topic || typeof gameData.topic === 'number')) {
                        throw new Error('E_INVALID_GAME_DATA: INVALID_TOPIC');
                    }
                    debug(`Servicing create game request for ${gameData.name}`);
                    resolve();
                })
                .then(() => dao.addGame(gameData))
                .then((game) => game.id);
        }

        /**
         * Add a player to an existing mafia game
         *
         * @param {GameIdentifier} gameId ID of the game to add the player to.
         * @param {User|string} user User to add to the game
         */
        static addPlayer(gameId, user) {
            let username = null;
            return new Promise((resolve) => {
                    if (!gameId) {
                        throw new Error('E_MISSING_GAME_IDENTIFIER');
                    }
                    if (typeof user === 'string' && user.length > 0) {
                        username = user;
                        return resolve();
                    }
                    if (user instanceof forum.User) {
                        username = user.username;
                        return resolve();
                    }
                    throw new Error('E_INVALID_USER');
                })
                .then(() => dao.getGameById(gameId))
                .then((game) => game.addPlayer(username))
                .then(() => undefined);
        }

        /**
         * Add a moderator to an existing mafia game
         *
         * @param {GameIdentifier} gameId ID of the game to add the moderator to.
         * @param {User|string} user User to add to the game
         */
        static addModerator(gameId, user) {
            let username = null;
            return new Promise((resolve) => {
                    if (!gameId) {
                        throw new Error('E_MISSING_GAME_IDENTIFIER');
                    }
                    if (typeof user === 'string' && user.length > 0) {
                        username = user;
                        return resolve();
                    }
                    if (user instanceof forum.User) {
                        username = user.username;
                        return resolve();
                    }
                    throw new Error('E_INVALID_USER');
                })
                .then(() => dao.getGameById(gameId))
                .then((game) => game.addModerator(username))
                .then(() => undefined);
        }
    }
    return Game;
};
