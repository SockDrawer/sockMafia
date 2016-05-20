'use strict';

class MafiaAction {
    constructor(data, game) {
        data.action = data.action || 'vote';
        data.token = data.token || 'vote';
        this._data = data;
        this._game = game;
    }
    get postId() {
        return this._data.postId;
    }
    get actor() {
        return this._game._getPlayer(this._data.actor);
    }
    get target() {
        return this._game._getPlayer(this._data.target);
    }
    get action() {
        return this._data.action;
    }
    get token() {
        return this._data.token;
    }
    get isCurrent() {
        return !this._data.revokedId;
    }
    get revokedId() {
        return this._data.revokedId;
    }

    get day() {
        return this._data.day;
    }

    revoke(postId) {
        this._data.revokedId = postId;
        return this._game.save().then(() => this);
    }
    toJSON(){
        return this._data;
    }
}
module.exports = MafiaAction;
