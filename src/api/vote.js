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
                .then(() => {
                    if (typeof sourcePost === 'number') {
                        postId = sourcePost;
                    } else if (sourcePost instanceof forum.Post) {
                        postId = sourcePost.id;
                    } else {
                        throw new Error('E_INVALID_POST');
                    }
                })
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
    }
    return Vote;
};
