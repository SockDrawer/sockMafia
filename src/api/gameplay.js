'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.gameplay
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:gameplay');
const utils = require('./utils');

exports.bindForum = (forum, dao) => {
    class GamePlay {
        /**
         * Kill a player in the game
         *
         * Game rules:
         *  - A player can only be killed if they are already in the game.
         *  - A player can only be killed if they are alive.
         *  - A player can only be killed by the mod.
         *
         * @param {GameIdentifier}  gameId      The game to modify
         * @param {User|string}     moderator   The moderator who is issuing the kill
         * @param {User|string}     player      The Player to kill
         * @returns {Promise}       Resolves on completion
         */
        static killPlayer(gameId, moderator, player) {
            debug(`Received kill request for ${player} in ${gameId} from ${moderator}`);
            let game, user;
            return utils.getGame(gameId, dao)
                .then(mafiaGame => {
                    if (!mafiaGame.isActive) {
                        throw new Error('E_GAME_NOT_ACTIVE');
                    }
                    game = mafiaGame;
                })
                .then(() => utils.getUser(moderator, game, forum))
                .then((mafiaUser) => {
                    if (!mafiaUser.isModerator) {
                        throw new Error('E_ACTOR_NOT_MODERATOR');
                    }
                })
                .then(() => utils.getUser(player, game, forum))
                .then((mafiaUser) => {
                    if (!mafiaUser.isAlive) {
                        throw new Error('E_PLAYER_NOT_ALIVE');
                    }
                    user = mafiaUser;
                })
                .then(() => {
                    debug(`Killing ${user.username} in ${game.name}`);
                    return game.killPlayer(user);
                })
                // TODO: add "Auto Post RoleCard functionality"
                .then(() => undefined);
        }
    }
    return GamePlay;
};
