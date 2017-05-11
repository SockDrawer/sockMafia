'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.vote
 * @author Accalia
 * @license MIT
 */
const utils = require('./utils');

exports.bindForum = (forum, dao) => {
    class Actions {
        /**
         * Issue an action in an active game
         *
         * Game rules:
         *  - The action can only be issued in an active game.
         *  - The action can only be issued by a living player in the game.
         *  - The action can only be issued against a living player in the game.
         *  - Issuing a action will revoke a previous action.
         *
         * @param {GameIdentifier}      gameId          The game to modify
         * @param {string|forum.User}   actor           The actor modifying the game
         * @param {string|forum.User}   target          The target user for the action
         * @param {number|forum.Post}   sourcePost      The source of the action
         * @param {string}              actionType      The specific action type
         * @param {string}              actionToken     The specific action token
         * @returns {Promise}           Resolves on completion
         */
        static issueAction(gameId, actor, target, sourcePost, actionType, actionToken) {
                let game, actingUser, targetUser, postId;
                actionType = `${actionType}`;
                return utils.getActiveGame(gameId, dao)
                    .then(mafiaGame => game = mafiaGame)
                    // Retieve and validate actor
                    .then(() => utils.getLivePlayer(actor, game, forum, 'actor'))
                    .then((mafiaUser) => actingUser = mafiaUser)
                    // Retrieve and validate target
                    .then(() => utils.getLivePlayer(target, game, forum, 'target'))
                    .then((mafiaUser) => targetUser = mafiaUser)
                    // Validate sourcePost
                    .then(() => utils.extractPostId(sourcePost, forum))
                    .then((post) => postId = post)
                    // Ensure no sneaky voting
                    .then(() => {
                        if (actionType.toLowerCase() === 'vote') {
                            throw new Error('E_CANNOT_ISSUE_VOTE_AS_ACTION');
                        }
                    })
                    //Revoke existing action for actor
                    .then(() => game.getAction(actingUser, undefined, actionType, actionToken, game.day, false))
                    .then((prior) => {
                        if (prior) {
                            return prior.revoke(postId);
                        }
                    })
                    // Register new vote
                    .then(() => game.registerAction(postId, actingUser, targetUser, actionType, actionToken))
                    //TODO: perform autolynch
                    .then(() => undefined);
            }
            /**
             * Issue a vote in an active game
             *
             * Game rules:
             *  - The vote can only be revoked in an active game.
             *  - The vote can only be revoked during a day phase.
             *  - The vote can only be revoked by a living player in the game.
             *  - The vote can be revoked from any player in the game.
             *  -
             *
             * @param {GameIdentifier}      gameId          The game to modify
             * @param {string|forum.User}   actor           The actor modifying the game
             * @param {string|forum.User}   [target]        The target user for the action
             * @param {number|forum.Post}   sourcePost      Source post of the vote
             * @returns {Promise}           Resolves on completion
             */
        static revokeAction(gameId, actor, target, sourcePost, actionType, actionToken) {
            let game, actingUser, targetUser, postId;
            return utils.getActiveGame(gameId, dao)
                .then(mafiaGame => game = mafiaGame)
                // Retieve and validate actor
                .then(() => utils.getLivePlayer(actor, game, forum, 'actor'))
                .then((mafiaUser) => actingUser = mafiaUser)
                // Retrieve and validate target
                .then(() => {
                    if (target) {
                        return utils.getUser(target, game, forum, 'target')
                            .then((mafiaUser) => targetUser = mafiaUser);
                    }
                })
                // Validate sourcePost
                .then(() => {
                    if (sourcePost) {
                        return utils.extractPostId(sourcePost, forum)
                            .then((post) => postId = post);
                    }
                })
                .then(() => {
                    if (actionType.toLowerCase() === 'vote') {
                        throw new Error('E_CANNOT_REVOKE_VOTE_AS_ACTION');
                    }
                })
                // Revoke existing vote for actor
                // targetUser will be undefined if target was not provided
                .then(() => game.getAction(actingUser, targetUser, actionType, actionToken, game.day, false))
                .then((priorVote) => {
                    if (priorVote) {
                        return priorVote.revoke(postId);
                    } else {
                        if (targetUser) {
                            throw new Error('E_NO_TARGET_ACTION');
                        } else {
                            throw new Error('E_NO_ACTION');
                        }
                    }
                })
                //TODO: perform autolynch
                .then(() => undefined);
        }
    }
    return Actions;
};
