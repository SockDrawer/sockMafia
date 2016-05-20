'use strict';

const string = require('string');
const MafiaUser = require('./mafiaUser'),
    MafiaAction = require('./mafiaAction');

function getUserSlug(user) {
    if (!user) {
        return null;
    }
    if (user instanceof MafiaUser) {
        return user.userslug;
    }
    return string(user).slugify().s;
}

function getUser(game, source, user) {
    const slug = getUserSlug(user);
    if (slug && source[slug]) {
        return new MafiaUser(source[slug], game);
    }
    return null;

}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const idx = Math.floor(Math.random() * (i + 1));
        const val = arr[idx];
        arr[idx] = arr[i];
        arr[i] = val;
    }
    return arr;
}

function setDefault(value, fallback) {
    return value || fallback;
}

class MafiaGame {
    constructor(data, dao) {
        data.name = setDefault(data.name, `mafia_${data.topicId}`);
        data.day = setDefault(data.day, 1);
        data.phases = setDefault(data.phases, ['day', 'night']);
        data.phase = setDefault(data.phase, data.phases[0]);
        if (data.phases.indexOf(data.phase) < 0) {
            data.phase = data.phases[0];
        }
        data.isActive = data.isActive !== undefined ? data.isActive : true;
        data.livePlayers = setDefault(data.livePlayers, {});
        data.deadPlayers = setDefault(data.deadPlayers, {});
        data.moderators = setDefault(data.moderators, {});
        data.actions = setDefault(data.actions, []);
        this._data = data;
        this._dao = dao;
    }
    get topicId() {
        return this._data.topicId;
    }
    get name() {
        return this._data.name;
    }
    get day() {
        return this._data.day;
    }
    get phase() {
        return this._data.phase;
    }
    get isDay() {
        return `${this._data.phase}`.toLowerCase().indexOf('day') >= 0;
    }
    get isNight() {
        return `${this._data.phase}`.toLowerCase().indexOf('night') >= 0;
    }
    get isActive() {
        return this._data.isActive;
    }
    get livePlayers() {
        const players = Object.keys(this._data.livePlayers);
        shuffle(players);
        return players.map((player) => new MafiaUser(this._data.livePlayers[player], this));
    }
    get deadPlayers() {
        const players = Object.keys(this._data.deadPlayers);
        shuffle(players);
        return players.map((player) => new MafiaUser(this._data.deadPlayers[player], this));
    }
    get moderators() {
        const mods = Object.keys(this._data.moderators);
        return mods.map((mod) => new MafiaUser(this._data.moderators[mod], this));
    }
    save() {
        return this._dao.save().then(() => this);
    }
    addPlayer(username) {
        const user = new MafiaUser({
            username: username
        }, this);
        const livingConflict = this._data.livePlayers[user.userslug];
        const deadConflict = this._data.deadPlayers[user.userslug];
        const modConflict = this._data.moderators[user.userslug];
        if (livingConflict || deadConflict || modConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.livePlayers[user.userslug] = user.toJSON();
        return this.save().then(() => user);
    }
    addModerator(username) {
        const moderator = new MafiaUser({
            username: username,
            isModerator: true
        }, this);
        const livingConflict = this._data.livePlayers[moderator.userslug];
        const deadConflict = this._data.deadPlayers[moderator.userslug];
        const modConflict = this._data.moderators[moderator.userslug];
        if (livingConflict || deadConflict || modConflict) {
            return Promise.reject('E_USER_EXIST');
        }
        this._data.moderators[moderator.userslug] = moderator.toJSON();
        return this.save().then(() => moderator);
    }
    _getPlayer(user) {
        const liveUser = getUser(this, this._data.livePlayers, user);
        if (liveUser) {
            return liveUser;
        }
        return getUser(this, this._data.deadPlayers, user);
    }
    getPlayer(user) {
        const player = this._getPlayer(user);
        if (!player) {
            throw new Error('E_USER_NOT_EXIST');
        }
        return player;
    }
    killPlayer(user) {
        const player = getUser(this, this._data.livePlayers, user);
        if (player) {
            player.isAlive = false;
            delete this._data.livePlayers[player.userslug];
            this._data.deadPlayers[player.userslug] = player.toJSON();
            return this.save().then(() => player);
        }
        return Promise.reject('E_USER_NOT_LIVE');
    }
    resurectPlayer(user) {
        const player = getUser(this, this._data.deadPlayers, user);
        if (player) {
            player.isAlive = true;
            delete this._data.deadPlayers[player.userslug];
            this._data.livePlayers[player.userslug] = player.toJSON();
            return this.save().then(() => player);
        }
        return Promise.reject('E_USER_NOT_DEAD');
    }
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
    newDay() {
        this._data.day += 1;
        this._data.phase = this._data.phases[0];
        return this.save();
    }
    getAction(actor, target, type, actionToken, day) {
        actor = getUserSlug(actor);
        target = getUserSlug(target);
        type = type || 'vote';
        day = day || this.day;
        let actions = this._data.actions.filter((action) => {
            return action.actor === actor &&
                action.day === day &&
                action.type === type;
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
    getActions(type, day, includeDeadPlayers) {
        includeDeadPlayers = includeDeadPlayers !== undefined ? includeDeadPlayers : false;
        type = type || 'vote';
        day = day || this.day;
        const actions = this._data.actions.filter((action) => {
            return action.day === day &&
                action.type === type &&
                (
                    includeDeadPlayers ||
                    !!this._data.livePlayers[action.actor]
                );
        });
        return actions.map((action) => new MafiaAction(action, this));
    }
    registerAction(postId, actor, target, type, actionToken) {
        actor = getUser(this, this._data.livePlayers, actor);
        target = getUser(this, this._data.livePlayers, target);
        if (!actor) {
            return Promise.reject('E_ACTOR_NOT_ALIVE');
        }
        const prior = this.getAction(actor, target, type, actionToken, this.day);
        let rescind = null;
        if (prior) {
            rescind = prior.revoke(postId);
        } else {
            rescind = Promise.resolve();
        }
        const action = new MafiaAction({
            postId: postId,
            actor: actor.userslug,
            target: target.userslug,
            action: type,
            actionToken: actionToken,
            day: this.day
        }, this);
        this._data.actions.push(action);
        return rescind
            .then(() => this.save())
            .then(() => action);
    }
    revokeAction(postId, actor, target, type, actionToken) {
        actor = getUser(this, this._data.livePlayers, actor);
        if (!actor) {
            return Promise.reject('E_ACTOR_NOT_ALIVE');
        }
        const action = this.getAction(actor, target, type, actionToken, this.day);
        let rescind = null;
        if (action) {
            rescind = action.revoke(postId);
        } else {
            rescind = Promise.resolve();
        }
        return rescind
            .then(() => action);
    }
    toJSON() {
        return this._data;
    }
}

module.exports = MafiaGame;
