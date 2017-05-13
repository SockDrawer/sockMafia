'use strict';
/**
 * sockMafia Game class
 * @module sockmafia.src.dao.MafiaGame
 * @author Accalia
 * @license MIT
 */


const string = require('string'),
    uuid = require('uuid');
const MafiaUser = require('./mafiaUser'),
    MafiaAction = require('./mafiaAction');


const debug = require('debug')('sockbot:mafia:dao:game');
/**
 * Turn a string or a MafiaUser into a userslug.
 *
 * used for indexes into objects and for matching users.
 *
 * @param {string|MafiaUser} user Username of user or MafiaUser object
 *
 * @returns {string} Userslug for the input
 */
function getUserSlug(user) {
    if (!user) {
        return null;
    }
    if (user instanceof MafiaUser) {
        return user.userslug;
    }
    return string(user).slugify().s;
}

/**
 * Get a MafiaUser from a data dictionary
 *
 * @param {MafiaGame} game The MafiaGame the user belongs to.
 * @param {object} source Serialized User Mapping to retrieve MafiaUser from
 * @param {string|MafiaUser} user User to retrieve from `source`
 * @returns {MafiaUser} Mathing MafiaUser or null if no user matched
 */
function getUser(game, source, user) {
    const slug = getUserSlug(user);
    if (slug && source[slug]) {
        return new MafiaUser(source[slug], game);
    }
    return null;

}

/**
 * Perform an in place Fischer Yates shuffle on an array
 *
 * @param {Array<*>} arr Array to shuffle. Will be modified in place
 * @returns {Array<*>} The shuffled input array, because why not?
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const idx = Math.floor(Math.random() * (i + 1));
        const val = arr[idx];
        arr[idx] = arr[i];
        arr[i] = val;
    }
    return arr;
}

/**
 * Return the existing value, unless falsy then return fallback value
 *
 * @param {*} value Existing value
 * @param {*} fallback Fallback value
 * @returns {*} `value` if `value` is truthy, else `fallback`
 */
function setDefault(value, fallback) {
    return value || fallback;
}

/**
 * MafiaGame class
 *
 */
class MafiaGame {
    /**
     * Mafia Game constructor. Creates a new MafiaGame instance
     *
     * @param {object} data Persisted game data
     * @param {string} data.name Name of the game
     * @param {number} data.topicId Id of the topic the game is played in
     * @param {number} data.day Current day of the game
     * @param {Array<string>} data.phases Configured day phases
     * @param {string} data.phase Current phase of day
     * @param {boolean} data.isActive Is Game Active?
     * @param {object<string,object>} data.livePlayers Map of live players by userslug
     * @param {object<string,object>} data.deadPlayers Map of dead players by userslug
     * @param {object<string,object>} data.moderators Map of moderators by userslug
     * @param {Array<object>} data.actions List of actions performed in this game
     * @param {object} data.values Key value map of custom values stored as part of the game
     * @param {MafiaDao} dao MafiaDao this game is a part of
     */
    constructor(data, dao) { //eslint-disable-line max-statements
        data.id = setDefault(data.id, uuid());
        data.name = setDefault(data.name, `mafia_${data.topicId}`);
        data.day = setDefault(data.day, 1);
        data.phases = setDefault(data.phases, ['day', 'night']);
        data.phase = setDefault(data.phase, data.phases[0]);
        if (data.phases.indexOf(data.phase) < 0) { // Sanity check on the phase of day.
            data.phase = data.phases[0];
        }
        data.isActive = data.isActive !== undefined ? data.isActive : true;
        data.players = setDefault(data.players, {});
        data.moderators = setDefault(data.moderators, {});
        data.actions = setDefault(data.actions, []);
        data.values = setDefault(data.values, {});
        data.aliases = setDefault(data.aliases, [data.name.toLowerCase(), `t_${data.topicId}`]);
        this._data = data;
        this._dao = dao;
    }

    /**
     * Get the id of this game
     *
     * @returns {gameToken} the id of the game
     */
    get id() {
        return this._data.id;
    }

    /**
     * Get the topic id this game is playing in
     *
     * @returns {number} the topicId the game is playing in
     */
    get topicId() {
        return this._data.topicId;
    }

    /**
     * Get the game name
     *
     * @returns {string} The name of the game
     *
     */
    get name() {
        return this._data.name;
    }

    /**
     * Get the day the game is in
     *
     * @returns {number} The current day
     */
    get day() {
        return this._data.day;
    }

    /**
     * Gets the current phase of day the game is in
     *
     * @returns {string} The current game phase
     */
    get phase() {
        return this._data.phase;
    }

    /**
     * Gets wether the game is in a day phase.
     *
     * This is simply asking "does the current phase contain `day`?"
     *
     * @returns {boolean} true if the current phase contains `day`, false otherwise
     */
    get isDay() {
        return `${this._data.phase}`.toLowerCase().indexOf('day') >= 0;
    }

    /**
     * Gets wether the game is in a night phase.
     *
     * This is simply asking "does the current phase contain `night`?"
     *
     * @returns {boolean} true if the current phase contains `night`, false otherwise
     */
    get isNight() {
        return `${this._data.phase}`.toLowerCase().indexOf('night') >= 0;
    }

    /**
     * gets wether the game is active
     *
     * @returns {boolean} true if the game is active, false otherwise.
     */
    get isActive() {
        return this._data.isActive;
    }

    /**
     * sets the game to active state
     *
     * @returns {Promise<Game>} resloves to self on completion
     */
    setActive() {
        this._data.isActive = true;
        return this.save();
    }

    /**
     * sets the game to active state
     *
     * @returns {Promise<Game>} resloves to self on completion
     */
    setInactive() {
        this._data.isActive = false;
        return this.save();
    }

    /**
     * Get a randomly ordered list of living players
     *
     * @returns {Array<MafiaUser>} A randomly ordered list of living players
     */
    get livePlayers() {
        return this.allPlayers.filter(player => player.isAlive);
    }

    /**
     * Get a randomly ordered list of dead players
     *
     * @returns {Array<MafiaUser>} A randomly ordered list of dead players
     */
    get deadPlayers() {
        return this.allPlayers.filter(player => !player.isAlive);
    }

    /**
     * Get a randomly ordered list of all players
     *
     * @returns {Array<MafiaUser>} A randomly ordered list of all players
     */
    get allPlayers() {
        const players = Object.keys(this._data.players);
        shuffle(players);
        return players.map((player) => new MafiaUser(this._data.players[player], this));
    }

    /**
     * Get an ordered list of game moderators
     *
     * @returns {Array<MafiaUser>} An ordered list of game moderators
     */
    get moderators() {
        const mods = Object.keys(this._data.moderators);
        return mods.map((mod) => new MafiaUser(this._data.moderators[mod], this));
    }

    /**
     * Get a list of the aliases for this game
     *
     * @returns {Array<string>} A list of aliases for this game.
     */
    get aliases() {
        return this._data.aliases.slice();
    }

    /**
     * Get a list of the phases for this game
     *
     * @returns {Array<string>} A list of phases for this game.
     */
    get phases() {
        return this._data.phases.slice();
    }


    /**
     * Get a custom value attached to the game
     *
     * @param {string} key Value storage key
     * @returns {*} Stored value for `key`
     */
    get values() {
        return JSON.parse(JSON.stringify(this._data.values));
    }

    /**
     * Save game data to disk
     *
     * @returns {Promise<MafiaGame>} Resolves to self on completion.
     */
    save() {
        return this._dao.save().then(() => this);
    }

    /**
     * Add a new player to the list of living players
     *
     * @param {string} username Username of the new player
     * @returns {Promise<MafiaUser>} Resolves to added user, Rejects if user already exists in game
     *
     */
    addPlayer(username) {
        const user = new MafiaUser({
            username: username
        }, this);
        const playerConflict = this._data.players[user.userslug];
        const modConflict = this._data.moderators[user.userslug];
        if (playerConflict || modConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.players[user.userslug] = user.toJSON();
        debug(`Added player ${username}`);
        return this.save().then(() => user);
    }

    /**
     * Add a moderator to the game
     *
     * @param {string} username Username of the game moderator
     * @returns {Promise<MafiaUser>} Resolves to added moderator, Rejects if moderator already exists in game
     */
    addModerator(username) {
        const moderator = new MafiaUser({
            username: username,
            isModerator: true
        }, this);
        const playerConflict = this._data.players[moderator.userslug];
        const modConflict = this._data.moderators[moderator.userslug];
        if (playerConflict || modConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.moderators[moderator.userslug] = moderator.toJSON();
        debug(`Added moderator ${username}`);
        return this.save().then(() => moderator);
    }

    /**
     * Get a player
     *
     * @private Use getPlayer() for external references
     *
     * @param {string|MafiaUser} user User to fetch
     * @returns {MafiaUser} Requested MafiaUser, null if no matching user found
     */
    _getPlayer(user) {
        return getUser(this, this._data.players, user);
    }

    /**
     * Get a game moderator
     *
     *
     * @param {string|MafiaUser} mod Moderator to fetch
     * @returns {MafiaUser} Requested MafiaUser, null if no matching user found
     */
    getModerator(mod) {
        const moderator = getUser(this, this._data.moderators, mod);
        if (!moderator) {
            throw new Error('E_MODERATOR_NOT_EXIST');
        }
        return moderator;
    }

    /**
     * Get a player
     *
     * @param {string|MafiaUser} user User to fetch
     * @returns {MafiaUser} Requested User
     * @throws {Error<E_USER_NOT_EXIST>} Throes error if requested user is not part of the game
     */
    getPlayer(user) {
        const player = this._getPlayer(user);
        if (!player) {
            throw new Error('E_USER_NOT_EXIST');
        }
        return player;
    }

    /**
     * Kill a player in the game
     *
     * @param {string|MafiaUser} user User to kill
     * @returns {Promise<MafiaUser>} Resolves to terminated user, Rejects if target user was not alive to be killed.
     */
    killPlayer(user) {
        const player = getUser(this, this._data.players, user);
        if (player && player.isAlive) {
            player.isAlive = false;
            debug(`Killed player ${user}`);
            return this.save().then(() => player);
        }
        return Promise.reject(new Error('E_USER_NOT_LIVE'));
    }

    /**
     * Return a player to the laand of the living
     *
     * @param {string|MafiaUser} user Player to Lazarus
     * @returns {Promise<MafiaUser>} resolves to the resurected user, rejects if user was not dead to resurect.
     */
    resurectPlayer(user) {
        const player = getUser(this, this._data.players, user);
        if (player && !player.isAlive) {
            player.isAlive = true;
            debug(`Resurrected ${user}`);
            return this.save().then(() => player);
        }
        return Promise.reject('E_USER_NOT_DEAD');
    }

    /**
     * Advance to the next phase of day
     *
     * Advances automatically to the next day if in the last phase of the day
     *
     * @returns {Promise<MafiaGame>} Resolves to self after advancing phase.
     */
    nextPhase() {
        const idx = this._data.phases.indexOf(this._data.phase);
        const newPhase = idx >= 0 && this._data.phases[idx + 1];
        if (!newPhase) {
            this._data.day += 1;
            this._data.phase = this._data.phases[0];
        } else {
            this._data.phase = newPhase;
        }
        return this.save();
    }

    /**
     * Advance to the first phase of the next day
     *
     * This will skip any unplayed phases in the current day.
     *
     * @returns {Promise<MafiaGame>} Resolves to self after advancing day
     */
    newDay() {
        this._data.day += 1;
        this._data.phase = this._data.phases[0];
        return this.save();
    }

    /**
     * Get a specific game action
     *
     * @param {string|MafiaUser} actor Actor for the requested action
     * @param {string|MafiaUser} [target] Target for the requested action
     * @param {string} [type='vote'] Action type of the requested action
     * @param {string} [actionToken] ActionToken of the requested action
     * @param {number} [day=this.day] Day of the game for the requested action
     * @param {boolean} [includeRevokedActions=true] If true include actions that have been revoked
     * @returns {MafiaAction} Action matching the provided query, null if no action matched query
     */
    getAction(actor, target, type, actionToken, day, includeRevokedActions) {
        actor = getUserSlug(actor);
        target = getUserSlug(target);
        type = type || 'vote';
        day = day || this.day;
        includeRevokedActions = includeRevokedActions !== undefined ? includeRevokedActions : true;
        let actions = this._data.actions.filter((action) => {
            return action.actor === actor &&
                action.day === day &&
                action.action === type &&
                (
                    includeRevokedActions ||
                    !action.revokedId
                );
        });
        if (target) {
            actions = actions.filter((action) => action.target === target);
        }
        if (actionToken) {
            actions = actions.filter((action) => action.token === actionToken);
        }
        if (!actions[0]) {
            return null;
        }
        return new MafiaAction(actions[0], this);
    }

    /**
     * Get latest game action of the given type
     *
     * @param {string} [type='vote'] Action type of the requested action
     * @param {string|MafiaUser} [target] Target for the requested action
     * @param {string} [actionToken] ActionToken of the requested action
     * @param {number} [day=this.day] Day of the game for the requested action
     * @param {boolean} [includeRevokedActions=false] If true include actions that have been revoked
     * @returns {MafiaAction} Action matching the provided query, null if no action matched query
     */
    getActionOfType(type, target, actionToken, day, includeRevokedActions) {
        target = getUserSlug(target);
        type = type || 'vote';
        day = day || this.day;
        let actions = this._data.actions.filter((action) => {
            return action.day === day &&
                action.action === type &&
                (
                    includeRevokedActions ||
                    !action.revokedId
                );
        });
        if (target) {
            actions = actions.filter((action) => action.target === target);
        }
        if (actionToken) {
            actions = actions.filter((action) => action.token === actionToken);
        }
        if (!actions.length) {
            return null;
        }
        return new MafiaAction(actions[actions.length - 1], this);
    }


    /**
     * Get actions for a particular day of a particular type
     *
     * @param {string} [type='vote'] Action type to retrieve
     * @param {number} [day=this.day] Day to retrieve actions for
     * @param {boolean} [includeDeadPlayers=false] Include actions cast by players who are now dead?
     * @returns {Array<MafiaAction>} List of actions that match the provided query
     */
    getActions(type, day, includeDeadPlayers) {
        includeDeadPlayers = includeDeadPlayers !== undefined ? includeDeadPlayers : false;
        type = type || 'vote';
        day = day || this.day;
        const actions = this._data.actions.filter((action) => {
            return action.day === day &&
                action.action === type &&
                (
                    includeDeadPlayers ||
                    !!(this._data.players[action.actor] && this._data.players[action.actor].isAlive)
                );
        });
        return actions.map((action) => new MafiaAction(action, this));
    }

    /**
     * Register a new action
     *
     * Automatically revokes matching prior action by actor
     *
     * @param {number} postId Id of the post the ation was cast in
     * @param {string|MafiaUser} actor Actor for the Action
     * @param {string|MafiaAction} [target=null] Target for the Action
     * @param {string} [type='vote'] Type of action to register
     * @param {string} [actionToken='vote'] Token of the action to register
     * @returns {Promise<MafiaAction>} Resolves to created action
     */
    registerAction(postId, actor, target, type, actionToken) {
        actor = getUser(this, this._data.players, actor);
        target = getUserSlug(target);
        if (!actor || !actor.isAlive) {
            return Promise.reject(new Error('E_ACTOR_NOT_ALIVE'));
        }
        const prior = this.getAction(actor, undefined, type, actionToken, this.day, false);
        let revoker = null;
        if (prior) {
            revoker = prior.revoke(postId);
        } else {
            revoker = Promise.resolve();
        }
        const action = new MafiaAction({
            postId: postId,
            actor: actor.userslug,
            target: target,
            action: type,
            token: actionToken,
            day: this.day
        }, this);
        this._data.actions.push(action.toJSON());
        return revoker
            .then(() => this.save())
            .then(() => action);
    }

    /**
     * Revoke a registered  action
     *
     * @param {number} postId Id of the post the action was revokec in
     * @param {string|MafiaUser} actor Actor for the Action
     * @param {string|MafiaAction} [target=null] Target for the Action
     * @param {string} [type='vote'] Type of action to revoke
     * @param {string} [actionToken='vote'] Token of the action to revoke
     * @returns {Promise<MafiaAction>} Resolves to revoked action
     */
    revokeAction(postId, actor, target, type, actionToken) {
        actor = getUser(this, this._data.players, actor);
        if (!actor || !actor.isAlive) {
            return Promise.reject('E_ACTOR_NOT_ALIVE');
        }
        const action = this.getAction(actor, target, type, actionToken, this.day, false);
        let rescind = null;
        if (action && action.isCurrent) {
            rescind = action.revoke(postId);
        } else {
            rescind = Promise.resolve();
        }
        return rescind
            .then(() => action);
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
     * Add an alias to this game
     *
     * @param {string} alias Alias to add to the game
     * @returns {Promise} Resolves when alias has been added, Rejects if alias would conflict.
     */
    addAlias(alias) {
        alias = alias.toLowerCase();
        if (this._data.aliases.some((existing) => existing === alias)) {
            return Promise.resolve(this); // Alias already owned by this game
        }
        return this._dao.getGameByAlias(alias).then(() => {
            return Promise.reject('E_ALIAS_EXISTS');
        }, (reason) => {
            if (reason.message !== 'E_NO_GAME' &&
                reason !== 'E_NO_GAME') {
                return Promise.reject(reason);
            }
            this._data.aliases.push(alias);
            return this.save();
        });
    }

    /**
     * Remove an alias from this game
     *
     * @param {string} alias Alias to remove from the game
     * @returns {Promise<boolean>} Resolves true if alias existed, false otherwise
     */
    removeAlias(alias) {
        alias = alias.toLowerCase();
        if (this._data.aliases.some((existing) => existing === alias)) {
            this._data.aliases = this._data.aliases.filter((existing) => existing !== alias);
            return this.save().then(() => true);
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * Add a topic to this game
     *
     * @param {number} topicId ID of topic to add to the game
     * @returns {Promise} Resolves when topic has been added, Rejects if topic would conflict.
     */
    addTopic(topicId) {
        return this.addAlias(`t_${topicId}`);
    }

    /**
     * Remove a topic from this game
     *
     * @param {number} topicId ID of topic to remove from the game
     * @returns {Promise<boolean>} Resolves true if topic was member of game, false otherwise.
     */
    removeTopic(topicId) {
        return this.removeAlias(`t_${topicId}`);
    }

    /**
     * Add a chat thread to this game
     *
     * @param {number} chatId ID of chat to add to the game
     * @returns {Promise} Resolves when chat has been added, Rejects if chat would conflict.
     */
    addChat(chatId) {
        return this.addAlias(`c_${chatId}`);
    }

    /**
     * Remove a chat from this game
     *
     * @param {number} chatId ID of chat to remove from the game
     * @returns {Promise<boolean>} Resolves true if chat was member of game, false otherwise.
     */
    removeChat(chatId) {
        return this.removeAlias(`c_${chatId}`);
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

module.exports = MafiaGame;
