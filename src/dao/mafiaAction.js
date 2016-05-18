'use strict';

class MafiaAction {
    constructor(data, game) {
        data.action = data.action || 'vote';
        data.token = data.token || 'vote';
        this._data = data;
        this.game = game;
    }
    get postId() {
        return this._data.postId;
    }
    get actor() {
        return this._game.getPlayer(this._data.actor);
    }
    get target() {
        return this._game.getPlayer(this._data.target);
    }
    get action() {
        return this._data.action;
    }
    get token() {
        return this._data.token;
    }
    get isCurrent() {
        return !this._data.rescindedId;
    }
    get revokededId() {
        return this._data.revokedId;
    }
    revoke(postId) {
        this._data.revokedId = postId;
        return this._game.save().then(() => this);
    }
}
module.exports = MafiaAction;
