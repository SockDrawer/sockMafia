'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.game
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:player');
const utils = require('./utils');
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
    const getPlayerFromParams = (gameId, user) => utils.getGame(gameId, dao)
        .then((game) => utils.getUser(user, game, forum));

    class Player {
        /**
         * Add a player to an existing mafia game
         *
         * @param {GameIdentifier} gameId ID of the game to add the player to.
         * @param {User|string} user User to add to the game
         * @returns {Promise} Resolves on completion, rejects on failure.
         */
        static addPlayer(gameId, user) {
            let game = null;
            return utils.getGame(gameId, dao)
                .then((mafiaGame) => game = mafiaGame)
                .then(() => utils.extractUsername(user, forum))
                .then((username) => {
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
            let game = null;
            return utils.getGame(gameId, dao)
                .then((mafiaGame) => game = mafiaGame)
                .then(() => utils.extractUsername(user, forum))
                .then((username) => {
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
            return utils.getGame(gameId, dao)
                .then((mafiaGame) => game = mafiaGame)
                .then(() => utils.getUser(sender, game, forum))
                .then((mafiaUser) => {
                    if (!mafiaUser.isModerator) {
                        throw new Error('E_SENDER_IS_NOT_MODERATOR');
                    }
                })
                .then(() => utils.getUser(target, game, forum))
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
