'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.game
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:player');

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
    const validateGameIdUserParams = (gameId, user) => new Promise((resolve) => {
        if (!gameId) {
            throw new Error('E_MISSING_GAME_IDENTIFIER');
        }
        if (typeof user === 'string' && user.length > 0) {
            return resolve(user);
        }
        if (user instanceof forum.User) {
            return resolve(user.username);
        }
        throw new Error('E_INVALID_USER');
    });

    const getGame = (gameId) =>
        new Promise((resolve) => {
            if (!gameId) {
                throw new Error('E_MISSING_GAME_IDENTIFIER');
            }
            resolve();
        })
        .then(() => dao.getGameById(gameId));

    const getUser = (game, user) => Promise.resolve()
        .then(() => {
            if (typeof user === 'string' && user.length > 0) {
                return game.getPlayer(user);
            }
            if (user instanceof forum.User) {
                return game.getPlayer(user.username);
            }
            throw new Error('E_INVALID_USER');
        });

    const getPlayerFromParams = (gameId, user) => getGame(gameId)
        .then((game) => getUser(game, user));

    class Player {
        /**
         * Add a player to an existing mafia game
         *
         * @param {GameIdentifier} gameId ID of the game to add the player to.
         * @param {User|string} user User to add to the game
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addPlayer(gameId, user) {
            let username = null;
            return validateGameIdUserParams(gameId, user)
                .then((parsedUser) => username = parsedUser)
                .then(() => dao.getGameById(gameId))
                .then((game) => {
                    debug(`Adding player '${username}' to game '${gameId}'`);
                    return game.addPlayer(username);
                })
                .then(() => undefined);
        }

        /**
         * Add a moderator to an existing mafia game
         *
         * @param {GameIdentifier} gameId ID of the game to add the moderator to.
         * @param {User|string} user User to add to the game
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addModerator(gameId, user) {
            let username = null;
            return validateGameIdUserParams(gameId, user)
                .then((parsedUser) => username = parsedUser)
                .then(() => dao.getGameById(gameId))
                .then((game) => {
                    debug(`Adding moderator '${username}' to game '${gameId}'`);
                    return game.addModerator(username);
                })
                .then(() => undefined);
        }

        /**
         * Add a property to a user
         *
         * @param {GameIdentifier} gameId ID of the game manipulate.
         * @param {User|string} user User to modify
         * @param {string} property Property to add
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addPlayerProperty(gameId, user, property) {
            return getPlayerFromParams(gameId, user)
                .then((player) => player.addProperty(property))
                .then((result) => {
                    if (!result) {
                        throw new Error('E_PROPERTY_NOT_ADDED');
                    }
                });
        }

        /**
         * Remove a property from a user
         *
         * @param {GameIdentifier} gameId ID of the game manipulate.
         * @param {User|string} user User to modify
         * @param {string} property Property to remove
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static removePlayerProperty(gameId, user, property) {
            return getPlayerFromParams(gameId, user)
                .then((player) => player.removeProperty(property))
                .then((result) => {
                    if (!result) {
                        throw new Error('E_PROPERTY_NOT_AVAILABLE_TO_REMOVE');
                    }
                });
        }

        /**
         * Get properties assigned to a user
         *
         * @param {GameIdentifier} gameId ID of the game manipulate.
         * @param {User|string} user User to modify
         * @param {string} property Property to remove
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static getPlayerProperties(gameId, user) {
            return getPlayerFromParams(gameId, user)
                .then((player) => player.getProperties());
        }

        /**
         * Set a value on a user
         *
         * @param {GameIdentifier} gameId ID of the game manipulate.
         * @param {User|string} user User to modify
         * @param {string} name Value name to set
         * @param {*} value Value to store
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static setPlayerValue(gameId, user, name, value) {
            return getPlayerFromParams(gameId, user)
                .then((player) => player.setValue(name, value));
        }

        /**
         * Set a value on a user
         *
         * @param {GameIdentifier} gameId ID of the game manipulate.
         * @param {User|string} user User to modify
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static getPlayerValues(gameId, user) {
            return getPlayerFromParams(gameId, user)
                .then((player) => player.values);
        }

        /**
         * Send RoleCard to a user
         *
         * @param {GameIdentifier} gameId ID of the game to manipulate.
         * @param {User|string} sender User who is sending the role card
         * @param {User|string} target User who should receive the role card
         * @param {string} text Role Card Text
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static sendRoleCard(gameId, sender, target, text) {
            let game, user, title;
            return getGame(gameId)
                .then((mafiaGame) => game = mafiaGame)
                .then(() => getUser(game, sender))
                .then((mafiaUser) => {
                    if (!mafiaUser.isModerator) {
                        throw new Error('E_SENDER_IS_NOT_MODERATOR');
                    }
                })
                .then(() => getUser(game, target))
                .then((mafiaUser) => {
                    if (!mafiaUser.isAlive) {
                        throw new Error('E_TARGET_IS_NOT_ALIVE');
                    }
                    if (mafiaUser.isModerator) {
                        throw new Error('E_TARGET_IS_MODERATOR');
                    }
                    user = mafiaUser;
                })
                .then(() => {
                    title = `Rolecard for ${game.name}`;
                    if (game.values['rolecard-title']) {
                        title = game.values['rolecard-title'];
                    }
                })
                .then(() => {
                    const targets = game.moderators.map((mod) => mod.username);
                    targets.push(user.username);
                    return Promise.all(targets.map((t) => forum.User.getByName(t)));
                })
                .then((targets) => forum.PrivateMessage.create(targets, text, title))
                .then((chatroom) => Promise.all([
                    game.addChat(chatroom.id),
                    user.setValue('rolecard-id', chatroom.id),
                    user.setValue('rolecard-title', title),
                    user.setValue('rolecard-text', text)
                ]))
                .then(() => undefined);
        }
    }

    return Player;
};
