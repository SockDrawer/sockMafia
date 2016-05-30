'use strict';
/**
 * sockMafia Action class
 * @module sockmafia.src.dao.MafiaAction
 * @author Accalia
 * @license MIT
 */

/**
 * MafiaAction class
 *
 */
class MafiaAction {
    /**
     * Mafia Action constructor. Creates a new MafiaAction instance
     *
     * @param {object} data Persisted action data
     * @param {MafiaGame} game MafiaGame this action is a part of
     */
    constructor(data, game) {
        data.action = data.action || 'vote'; // Default action is 'vote'
        data.token = data.token || 'vote'; //Default token is 'vote'
        this._data = data;
        this._game = game;
    }

    /**
     * Get the postId this action was created for
     *
     * @returns {number} Post Id
     */
    get postId() {
        return this._data.postId;
    }

    /**
     * Get the MafiaUser who created this action
     *
     * @returns {MafiaUser} Actor user.
     */
    get actor() {
        return this._game._getPlayer(this._data.actor);
    }

    /**
     * Get the MafiaUser who created this action. May be null if action is targetless
     *
     * @returns {MafiaUser} Target User or null if action is targetless
     */
    get target() {
        return this._game._getPlayer(this._data.target);
    }

    /**
     * Get the action type of this MafiaAction.
     *
     * Default type is 'vote'
     *
     * @returns {string} Action type
     */
    get action() {
        return this._data.action;
    }

    /**
     * Get the action token for this MafiaAction.
     *
     * The default token is 'vote'
     *
     * @returns {string} Action token
     */
    get token() {
        return this._data.token;
    }

    /**
     * Is this Action current?
     *
     * Returns true if action is current, false if cancelled or overridden by a later action
     *
     * @returns {boolean} True if action is current, false otherwise
     */
    get isCurrent() {
        return !this._data.revokedId;
    }

    /**
     * Get the post Id this action was revoked in, or undefined if this action has not been revoked
     *
     * @returns {number} Post Id this MafiaAction was revoked in.
     */
    get revokedId() {
        return this._data.revokedId;
    }

    /**
     * Get the day this MafiaAction was created in
     *
     * @returns {number} The Day this MafiaAction was created in
     */
    get day() {
        return this._data.day;
    }

    /**
     * Revoke this MafiaAction as of a particular post.
     *
     * @param {number} postId The Id of the post that revoked the action
     *
     * @returns {Promise<MafiaAction>} Resolves to the revoked action on success.
     *
     */
    revoke(postId) {
        this._data.revokedId = postId;
        return this._game.save().then(() => this);
    }

    /**
     * Create a serializeable representation of the DAO object.
     *
     * @returns {object} A serializeable clone of this action's internal data store.
     */
    toJSON() {
        return this._data;
    }
}
module.exports = MafiaAction;
