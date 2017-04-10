'use strict';
/**
 * sockMafia User class
 * @module sockmafia.src.dao.MafiaUser
 * @author Accalia
 * @license MIT
 */

const string = require('string');

/**
 * MafiaUser class
 *
 */
class MafiaUser {
    /**
     * Mafia User constructor. Creates a new MafiaUser instance
     *
     * @param {object} data Persisted user data
     * @param {MafiaGame} game MafiaGame this user is a part of
     */
    constructor(data, game) {
        data.userslug = string(data.username).slugify().s;
        data.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        data.isModerator = data.isModerator !== undefined ? data.isModerator : false;
        data.properties = data.properties || [];
        data.values = data.values || {};
        this._data = data;
        this._game = game;
    }

    /**
     * Get the username of the MafiaUser
     *
     * @returns {string} Username of the user
     */
    get username() {
        return this._data.username;
    }

    /**
     * Get the case normalized userslug of the user, useful for comparing users.
     *
     * @returns {string} Userslug of the user
     *
     */
    get userslug() {
        return this._data.userslug;
    }

    /**
     * Is the user a living player?
     *
     * @returns {boolean} True if the user is a living player, false otherwise.
     *
     */
    get isAlive() {
        return this._data.isAlive;
    }

    /**
     * set alive status of the User
     *
     * TODO: this shouldn't be a setter as it does not save status when mutated.
     *
     * @param {boolean} value True to make the player live, false to make the player dead.
     */
    set isAlive(value) {
        this._data.isAlive = !!value;
    }

    /**
     * Is the user a moderator?
     *
     * @returns {boolean} true if user is a moderator of the game, false otherwise.
     */
    get isModerator() {
        return this._data.isModerator;
    }

    /**
     * Get custom values attached to the user
     *
     * @returns {object} Stored values
     */
    get values() {
        return JSON.parse(JSON.stringify(this._data.values));
    }

    /**
     * Get custom properties associated with the user.
     *
     * Optionally filter the list to only those properties requested
     *
     * @param {array<string>} [filterTo] Array or properties to filter results to.
     * @returns {array<string>} Custom properties on the user, with any requested filtering applied
     */
    getProperties(filterTo) {
        if (filterTo) {
            const map = {};
            this._data.properties.forEach((key) => {
                map[key] = 1;
            });
            return filterTo.filter((key) => map[key] === 1);
        }
        return this._data.properties.slice();
    }

    /**
     * Determine if custom property is associated with the user.
     *
     *
     * @param {string} property Array or properties to filter results to.
     * @returns {boolean} true if the user has the property, false otherwise
     */
    hasProperty(property) {
        return this._data.properties.some((prop) => prop === property);
    }

    /**
     * Add a custom property to the user.
     *
     * @param {string} property The property to add to the user
     *
     * @returns {Promise<boolean>} Resolves true if the property was added, false if it already existed on the user
     */
    addProperty(property) {
        if (this._data.properties.filter((prop) => prop === property).length > 0) {
            return Promise.resolve(false);
        }
        this._data.properties.push(property);
        return this._game.save().then(() => true);
    }

    /**
     * Remove a custom operty from the user
     *
     * @param {string} property the property to remove from the user
     *
     * @returns {Promise<boolean>} Resolves true if property was removed, false if property was not present to remove
     */
    removeProperty(property) {
        const props = this._data.properties;
        this._data.properties = this._data.properties.filter((prop) => prop !== property);
        return this._game.save()
            .then(() => props.length !== this._data.properties.length);
    }

    /**
     * Get a custom value attached to the game
     *
     * @param {string} key Value storage key
     * @returns {*} Stored value for `key`
     */
    getValue(key) {
        return this.values[key];
    }

    /**
     * Store a custom value attached to the game
     *
     * @param {string} key Value storage key
     * @param {*} data Value to store
     * @returns {Promise<*>} Resolves to prior stored value
     */
    setValue(key, data) {
        const oldVal = this._data.values[key];
        this._data.values[key] = data;
        return this.save().then(() => oldVal);
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

module.exports = MafiaUser;
