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
    const getActiveGame = (gameId) => utils.getGame(gameId, dao)
        .then(mafiaGame => {
            if (!mafiaGame.isActive) {
                throw new Error('E_GAME_NOT_ACTIVE');
            }
            return mafiaGame;
        });

    const validateModerator = (moderator, game) => utils.getUser(moderator, game, forum)
        .then((mafiaUser) => {
            if (!mafiaUser.isModerator) {
                throw new Error('E_ACTOR_NOT_MODERATOR');
            }
            return game;
        });

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
            return getActiveGame(gameId)
                .then(mafiaGame => game = mafiaGame)
                .then(() => validateModerator(moderator, game))
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
            return getActiveGame(gameId)
                .then(mafiaGame => game = mafiaGame)
                .then(() => validateModerator(moderator, game))
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
         * Unkill a player in the game
         *
         * Game rules:
         *  - A player can only be unkilled if they are already in the game.
         *  - A player can only be unkilled if they are dead.
         *  - A player can only be unkilled by the mod.
         *
         * @param {GameIdentifier}  gameId      The game to modify
         * @param {string}          [nextStage] The name of the stage to advance to
         * @returns {Promise}       Resolves on completion
         */
        static advancePhase(gameId, moderator, nextPhase) {
            debug(`Received request to advance ${gameId} to ${nextPhase || 'the next stage'}`);
            return getActiveGame(gameId)
                .then((game) => validateModerator(moderator, game))
                .then((game) => {
                    if (nextPhase === undefined) {
                        //advance a single stage
                        return game.nextPhase();
                    }
                    if (game.phases.some((stage) => stage === nextPhase)) {
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
    }
    return GamePlay;
};
