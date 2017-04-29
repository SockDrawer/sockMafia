'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.vote
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:vote');
const utils = require('./utils');

exports.bindForum = (forum, dao) => {
    const extractPostId = (sourcePost) => {
        if (typeof sourcePost === 'number') {
            return sourcePost;
        } else if (sourcePost instanceof forum.Post) {
            return sourcePost.id;
        } else {
            throw new Error('E_INVALID_POST');
        }
    };
    class Vote {
        /**
         * Issue a vote in an active game
         *
         * Game rules:
         *  - The vote can only be issued in an active game.
         *  - The vote can only be issued during a day phase.
         *  - The vote can only be issued by a living player in the game.
         *  - The vote can only be issued against a living player in the game.
         *  - An alternate vote may only be issued by a player with the `doublevoter` property
         *  - Issuing a vote will revoke a previous vote.
         *  - Issuing a vote may trigger a lynch.
         *
         * @param {GameIdentifier}      gameId          The game to modify
         * @param {string|forum.User}   actor           The actor modifying the game
         * @param {string|forum.User}   target          The target user for the action
         * @param {boolean}             isAlternateVote True if the vote is an alternate vote, false otherwise.
         * @param {number|forum.Post}   sourcePost      Source post of the vote
         * @returns {Promise}           Resolves on completion
         */
        static issueVote(gameId, actor, target, isAlternateVote, sourcePost) {
            let game, actingUser, targetUser, postId, voteToken;
            return utils.getActiveGame(gameId, dao)
                .then(mafiaGame => game = mafiaGame)
                // Retieve and validate actor
                .then(() => utils.getLivePlayer(actor, game, forum, 'actor'))
                .then((mafiaUser) => {
                    const voteNumber = isAlternateVote && mafiaUser.hasProperty('doublevoter') ? 2 : 1;
                    voteToken = `vote[${voteNumber}]`;
                    actingUser = mafiaUser;
                })
                // Retrieve and validate target
                .then(() => utils.getLivePlayer(target, game, forum, 'target'))
                .then((mafiaUser) => targetUser = mafiaUser)
                // Validate sourcePost
                .then(() => postId = extractPostId(sourcePost))
                //Revoke existing vote for actor
                .then(() => game.getAction(actingUser, undefined, 'vote', voteToken, game.day, false))
                .then((priorVote) => {
                    if (priorVote) {
                        return priorVote.revoke(postId);
                    }
                })
                // Register new vote
                .then(() => game.registerAction(postId, actingUser, targetUser, 'vote', voteToken))
                //TODO: perform autolynch
                .then(() => undefined);
        }

        /**
         * Nullify current votes in an active game
         *
         * Game rules:
         *  - The vote can only be nullified in an active game.
         *  - The vote can only be nullified during a day phase.
         *  - The vote can only be nullified by a living player in the game.
         *  - Nullifing votes will revoke all previous votes.
         *
         * @param {GameIdentifier}      gameId          The game to modify
         * @param {string|forum.User}   actor           The actor modifying the game
         * @param {number|forum.Post}   sourcePost      Source post of the vote
         * @returns {Promise}           Resolves on completion
         */
        static nullifyVote(gameId, actor, sourcePost) {
            let game, actingUser, postId;
            return utils.getActiveGame(gameId, dao)
                .then(mafiaGame => game = mafiaGame)
                // Retieve and validate actor
                .then(() => utils.getLivePlayer(actor, game, forum, 'actor'))
                .then((user) => actingUser = user)
                // Validate sourcePost
                .then(() => postId = extractPostId(sourcePost))
                //Revoke primary existing vote for actor
                .then(() => game.getAction(actingUser, undefined, 'vote', 'vote[1]', game.day, false))
                .then((priorVote) => {
                    if (priorVote) {
                        return priorVote.revoke(postId);
                    }
                })
                //Revoke alternate existing vote for actor
                .then(() => game.getAction(actingUser, undefined, 'vote', 'vote[2]', game.day, false))
                .then((priorVote) => {
                    if (priorVote) {
                        return priorVote.revoke(postId);
                    }
                })
                // register null vote
                .then(() => game.registerAction(postId, actingUser, null, 'vote', 'vote[1]'))
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
        static revokeVote(gameId, actor, target, sourcePost) {
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
                .then(() => postId = extractPostId(sourcePost))
                // Revoke existing vote for actor
                // targetUser will be undefined if target was not provided
                .then(() => game.getAction(actingUser, targetUser, 'vote', undefined, game.day, false))
                .then((priorVote) => {
                    if (priorVote) {
                        return priorVote.revoke(postId);
                    } else {
                        if (targetUser) {
                            throw new Error('E_NO_TARGET_VOTE');
                        } else {
                            throw new Error('E_NO_VOTE');
                        }
                    }
                })
                //TODO: perform autolynch
                .then(() => undefined);
        }
    }
    return Vote;
};
