'use strict';
/**
 * sockMafia API Provider
 * @module sockmafia.src.api.query
 * @author Accalia
 * @license MIT
 */

const debug = require('debug')('sockbot:mafia:api:query');

exports.bindForum = (forum, dao) => {
    const queryObj = {
        findGame: (query) => {
            if (typeof query === 'string') {
                debug(`findGame: Finding game by alias: ${query}`);
                return dao.getGameByName(query).then((game) => game.id);
            } else if (query instanceof forum.Topic) {
                debug(`findGame: Finding game by Topic: ${query}`);
                return dao.getGameByTopicId(query.id).then((game) => game.id);
            } else if (query instanceof forum.PrivateMessage) {
                debug(`findGame: Finding game by PrivateMessage: ${query}`);
                return dao.getGameByChatId(query.id).then((game) => game.id);
            }
            debug(`findGame: Cannot find game for ${query}`);
            return Promise.reject(new Error('E_INVALID_QUERY'));
        }
    };
    return queryObj;
};
