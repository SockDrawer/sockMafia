'use strict';
const string = require('string')

class MafiaUser {
    constructor(data, game) {
        data.userslug = string(data.username).slugify().s;
        data.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        data.isModerator = data.isModerator !== undefined ? data.isModerator : false;
        data.properties = data.properties || [];
        this._data = data;
        this._game = game;
    }
    get username() {
        return this._data.username;
    }
    get userslug() {
        return this._data.userslug;
    }
    get isAlive() {
        return this._data.isAlive;
    }
    set isAlive(value) {
        this._data.isAlive=!!value;
    }
    get isModerator() {
        return this._data.isModerator;
    }
    getProperties(filterTo) {
        if (filterTo) {
            const map = {};
            Object.keys(this._data.properties).forEach((key) => {
                map[key] = 1;
            });
            return filterTo.filter((key) => map[key] === 1);
        }
        return this._data.properties.slice();
    }
    addProperty(property) {
        if (this._data.properties.filter((prop) => prop === property).length > 0) {
            return Promise.resolve(false);
        }
        this._data.properties.push(property);
        return this._game.save().then(() => true);
    }
    removeProperty(property) {
        const props = this._data.properties;
        this._data.properties = this._data.properties.filter((prop) => prop !== property);
        return this._game.save()
            .then(() => props.length !== this._data.properties.length);
    }
    toJSON() {
        return this._data;
    }
}

module.exports = MafiaUser;
