'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.game
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:game');

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
         * Add an alias to the game
         *
         * @param {gameIdentifier} gameId Id of the game to add the play area to
         * @param {string} alias Alias to add to the game.
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addGameAlias(gameId, alias) {
            return dao.getGameById(gameId)
                .then((game) => {
                    if (typeof alias === 'string' && alias.length > 0) {
                        return game.addAlias(alias);
                    }
                    throw new Error('E_INVALID_ALIAS');
                })
                .then(() => undefined);
        }

        /**
         * Remove an alias to the game
         *
         * @param {gameIdentifier} gameId Id of the game to add the play area to
         * @param {string} alias Alias to remove from the game.
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static removeGameAlias(gameId, alias) {
            return dao.getGameById(gameId)
                .then((game) => {
                    if (typeof alias === 'string' && alias.length > 0) {
                        return game.removeAlias(alias);
                    }
                    throw new Error('E_INVALID_ALIAS');
                })
                .then((result) => {
                    if (!result) {
                        throw new Error('E_ALIAS_NOT_EXISTS');
                    }
                });
        }

        /**
         * Add a play area to the game
         *
         * @param {gameIdentifier} gameId Id of the game to add the play area to
         * @param {Topic|PrivateMessage} area Playable area to add to the game.
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addPlayArea(gameId, area) {
            return dao.getGameById(gameId)
                .then((game) => {
                    if (area instanceof forum.Topic) {
                        return game.addTopic(area.id);
                    } else if (area instanceof forum.PrivateMessage) {
                        return game.addChat(area.id);
                    }
                    throw new Error('E_INVALID_PLAY_AREA');
                })
                .then(() => undefined);
        }

        /**
         * Remove a play area from the game
         *
         * @param {gameIdentifier} gameId Id of the game to modify
         * @param {Topic|PrivateMessage} area Playable area to remove from the game.
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static removePlayArea(gameId, area) {
            return dao.getGameById(gameId)
                .then((game) => {
                    if (area instanceof forum.Topic) {
                        return game.removeTopic(area.id);
                    } else if (area instanceof forum.PrivateMessage) {
                        return game.removeChat(area.id);
                    }
                    throw new Error('E_INVALID_PLAY_AREA');
                })
                .then(result => {
                    if (!result) {
                        throw new Error('E_PLAY_AREA_NOT_IN_GAME');
                    }
                });
        }

        /**
         * Set a stored value in the game
         *
         * @param {GameIdentifier} gameId ID of the game to set values on.
         * @param {string} key Key to store the value under
         * @param {*} value Value to store
         * @returns {Promise<*>} Resolves to the prior value held
         */
        static setGameValue(gameId, key, value) {
            return dao.getGameById(gameId)
                .then((game) => {
                    if (typeof key !== 'string' || key.length <= 0) {
                        throw new Error('E_INVALID_KEY');
                    }
                    return game.setValue(key, value);
                });
        }

        /**
         * Get stored values from the game
         *
         * @param {GameIdentifier} gameId ID of the game to retrieve data from.
         * @returns {Promise<*>} Resolves to the prior value held
         */
        static getGameValues(gameId) {
            return dao.getGameById(gameId)
                .then((game) => game.values);
        }

    }
    return Game;
};