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
            return utils.getGameForModActivity(gameId, moderator, dao, forum)
                .then(mafiaGame => game = mafiaGame)
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

        /**
         * Unkill a player in the game
         *
         * Game rules:
         *  - A player can only be unkilled if they are already in the game.
         *  - A player can only be unkilled if they are dead.
         *  - A player can only be unkilled by the mod.
         *
         * @param {GameIdentifier}  gameId      The game to modify
         * @param {User|string}     moderator   The moderator who is issuing the unkill
         * @param {User|string}     player      The Player to unkill
         * @returns {Promise}       Resolves on completion
         */
        static unkillPlayer(gameId, moderator, player) {
            debug(`Received unkill request for ${player} in ${gameId} from ${moderator}`);
            let game, user;
            return utils.getGameForModActivity(gameId, moderator, dao, forum)
                .then(mafiaGame => game = mafiaGame)
                .then(() => utils.getUser(player, game, forum))
                .then((mafiaUser) => {
                    if (mafiaUser.isAlive) {
                        throw new Error('E_PLAYER_NOT_DEAD');
                    }
                    user = mafiaUser;
                })
                .then(() => {
                    debug(`Unkilling ${user.username} in ${game.name}`);
                    return game.resurectPlayer(user);
                })
                .then(() => undefined);
        }

        /**
         * Advance the game phase manually, may advance into the next day
         *
         * Game rules:
         *  - The phase can only be altered forward, no time travel to the past allowed.
         *  - The phase can only be altered if the game is active.
         *  - Only a moderator may alter the phase directly.
         *
         * @param {GameIdentifier}      gameId      The game to modify
         * @param {string|forum.User}   moderator   The Moderator modifying the game
         * @param {string}              [nextPhase] The name of the stage to advance to
         * @returns {Promise}           Resolves on completion
         */
        static advancePhase(gameId, moderator, nextPhase) {
            debug(`Received request to advance ${gameId} to ${nextPhase || 'the next stage'}`);
            return utils.getGameForModActivity(gameId, moderator, dao, forum)
                .then((game) => {
                    if (nextPhase === undefined) {
                        //advance a single stage
                        return game.nextPhase();
                    }
                    if (game.phases.some((phase) => phase === nextPhase)) {
                        const next = () => game.nextPhase().then(() => {
                            if (game.phase !== nextPhase) {
                                return next();
                            }
                        });
                        return next();
                    }
                    // target stage is not valid
                    throw new Error('E_INVALID_TARGET_STAGE');
                })
                .then(() => undefined);
        }

        /**
         * Advance the game to the next day
         *
         * Game rules:
         *  - The day can only be altered if the game is active.
         *  - Only a moderator may alter the day directly.
         *
         * @param {GameIdentifier}      gameId      The game to modify
         * @param {string|forum.User}   moderator   The Moderator modifying the game
         * @returns {Promise}           Resolves on completion
         */
        static advanceDay(gameId, moderator) {
            debug(`Received request to advance ${gameId} to the next day`);
            return utils.getGameForModActivity(gameId, moderator, dao, forum)
                .then((game) => game.newDay())
                .then(() => undefined);
        }
    }
    return GamePlay;
};
