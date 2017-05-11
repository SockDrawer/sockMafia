'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    MafiaGame = require('../../../src/dao/mafiaGame'),
    MafiaUser = require('../../../src/dao/mafiaUser'),
    MafiaAction = require('../../../src/dao/mafiaAction'),
    actionsApi = require('../../../src/api/actions'),
    utilsApi = require('../../../src/api/utils');

describe('api/actiona', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            actionsApi.should.have.keys(['bindForum']);
        });
    });
    describe('Actions', () => {
        let sandbox, Actions, forum, dao;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {
                Post: function Post(id) {
                    this.id = id;
                }
            };

            dao = new Dao(':memory:');
            Actions = actionsApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('issueAction()', () => {
            let mockGame, mockActor, mockTarget, mockAction,
                stubGetActiveGame, stubGetLivePlayer, stubExtractPostId, stubGetAction,
                stubRevokeAction, stubRegisterAction;
            beforeEach(() => {
                mockGame = new MafiaGame({
                    day: Math.random()
                }, {});
                mockActor = new MafiaUser({}, {});
                mockTarget = new MafiaUser({}, {});
                mockAction = new MafiaAction({}, {});
                stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(mockGame);
                stubGetLivePlayer = sandbox.stub(utilsApi, 'getLivePlayer').rejects(new Error('TOO MANY CALLS'));
                stubGetLivePlayer.onFirstCall().resolves(mockActor);
                stubGetLivePlayer.onSecondCall().resolves(mockTarget);
                stubExtractPostId = sandbox.stub(utilsApi, 'extractPostId').resolves(42);
                stubGetAction = sandbox.stub(mockGame, 'getAction').resolves(mockAction);
                stubRevokeAction = sandbox.stub(mockAction, 'revoke').resolves();
                stubRegisterAction = sandbox.stub(mockGame, 'registerAction').resolves();
            });
            it('should retrieve game by id', () => {
                const id = Math.random();
                return Actions.issueAction(id, 'actor', 'target', 42, 'action', 'token').then(() => {
                    stubGetActiveGame.calledWith(id, dao).should.be.true;
                });
            });
            it('should retrieve actor', () => {
                const name = Math.random();
                return Actions.issueAction('id', name, 'target', 42, 'action', 'token').then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'actor').should.be.true;
                });
            });
            it('should retrieve target', () => {
                const name = Math.random();
                return Actions.issueAction('id', 'actor', name, 42, 'action', 'token').then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should extract postId', () => {
                const id = Math.random();
                return Actions.issueAction('id', 'actor', 'target', id, 'action', 'token').then(() => {
                    stubExtractPostId.calledWith(id, forum).should.be.true;
                });
            });
            it('should retrieve current action', () => {
                const action = Math.random().toString();
                const token = Math.random();
                return Actions.issueAction('id', 'actor', 'target', 42, action, token).then(() => {
                    stubGetAction.calledWith(mockActor, undefined, action, token, mockGame.day, false).should.be.true;
                });
            });
            it('should revoke existing action', () => {
                const id = Math.random();
                stubExtractPostId.resolves(id);
                return Actions.issueAction('id', 'actor', 'target', 'id', 'action', 'token').then(() => {
                    stubRevokeAction.calledWith(id).should.be.true;
                });
            });
            it('should not revoke missing existing action', () => {
                const id = Math.random();
                stubExtractPostId.resolves(id);
                stubGetAction.resolves(null);
                return Actions.issueAction('id', 'actor', 'target', 'id', 'action', 'token').then(() => {
                    stubRevokeAction.calledWith(id).should.be.false;
                });
            });
            it('should register new action', () => {
                const id = Math.random();
                const action = Math.random().toString();
                const token = Math.random();
                stubExtractPostId.resolves(id);
                return Actions.issueAction('id', 'actor', 'target', 'id', action, token).then(() => {
                    stubRegisterAction.calledWith(id, mockActor, mockTarget, action, token).should.be.true;
                });
            });
            it('should revuse to register a vote', () => {
                return Actions.issueAction('id', 'actor', 'target', 'id', 'vote', 'token')
                    .should.be.rejectedWith('E_CANNOT_ISSUE_VOTE_AS_ACTION');
            });
            it('should resolve to undefined', () => {
                return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.become(undefined);
            });
            describe('Error Conditions', () => {
                it('should reject when game retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetActiveGame.rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when actor retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetLivePlayer.onFirstCall().rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when target retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetLivePlayer.onSecondCall().rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when postId extraction retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubExtractPostId.rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when action retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetAction.rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when action revocation fails', () => {
                    const err = new Error('OOPSIES!');
                    stubRevokeAction.rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when action registration fails', () => {
                    const err = new Error('OOPSIES!');
                    stubRegisterAction.rejects(err);
                    return Actions.issueAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
            });
        });
        describe('revokeAction()', () => {
            let mockGame, mockActor, mockTarget, mockAction,
                stubGetActiveGame, stubGetLivePlayer, stubGetUser, stubExtractPostId,
                stubGetAction, stubRevokeAction;
            beforeEach(() => {
                mockGame = new MafiaGame({
                    day: Math.random()
                }, {});
                mockActor = new MafiaUser({}, {});
                mockTarget = new MafiaUser({}, {});
                mockAction = new MafiaAction({}, {});
                stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(mockGame);
                stubGetLivePlayer = sandbox.stub(utilsApi, 'getLivePlayer').resolves(mockActor);
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockTarget);
                stubExtractPostId = sandbox.stub(utilsApi, 'extractPostId').resolves(42);
                stubGetAction = sandbox.stub(mockGame, 'getAction').resolves(mockAction);
                stubRevokeAction = sandbox.stub(mockAction, 'revoke').resolves();
            });
            it('should retrieve game by id', () => {
                const id = Math.random();
                return Actions.revokeAction(id, 'actor', 'target', 42, 'action', 'token').then(() => {
                    stubGetActiveGame.calledWith(id, dao).should.be.true;
                });
            });
            it('should retrieve actor', () => {
                const name = Math.random();
                return Actions.revokeAction('id', name, 'target', 42, 'action', 'token').then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'actor').should.be.true;
                });
            });
            it('should retrieve target', () => {
                const name = Math.random();
                return Actions.revokeAction('id', 'actor', name, 42, 'action', 'token').then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should extract postId', () => {
                const id = Math.random();
                return Actions.revokeAction('id', 'actor', 'target', id, 'action', 'token').then(() => {
                    stubExtractPostId.calledWith(id, forum).should.be.true;
                });
            });
            it('should retrieve current action', () => {
                const action = Math.random().toString();
                const token = Math.random();
                return Actions.revokeAction('id', 'actor', 'target', 42, action, token).then(() => {
                    stubGetAction.calledWith(mockActor, mockTarget, action, token, mockGame.day, false).should.be.true;
                });
            });
            it('should revoke existing action', () => {
                const id = Math.random();
                stubExtractPostId.resolves(id);
                return Actions.revokeAction('id', 'actor', 'target', 'id', 'action', 'token').then(() => {
                    stubRevokeAction.calledWith(id).should.be.true;
                });
            });
            it('should reject revoke missing existing action with target', () => {
                stubGetAction.resolves(null);
                return Actions.revokeAction('id', 'actor', 'target', 'id', 'action', 'token')
                    .should.be.rejectedWith('E_NO_TARGET_ACTION');
            });
            it('should reject revoke missing existing action without target', () => {
                stubGetAction.resolves(null);
                return Actions.revokeAction('id', 'actor', undefined, 'id', 'action', 'token')
                    .should.be.rejectedWith('E_NO_ACTION');
            });
            it('should refuse to register a vote', () => {
                return Actions.revokeAction('id', 'actor', 'target', 'id', 'vote', 'token')
                    .should.be.rejectedWith('E_CANNOT_REVOKE_VOTE_AS_ACTION');
            });
            it('should resolve to undefined', () => {
                return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.become(undefined);
            });
            describe('Error Conditions', () => {
                it('should reject when game retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetActiveGame.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when actor retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetLivePlayer.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when target retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetUser.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when postId extraction retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubExtractPostId.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when action retrieval fails', () => {
                    const err = new Error('OOPSIES!');
                    stubGetAction.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
                it('should reject when action revocation fails', () => {
                    const err = new Error('OOPSIES!');
                    stubRevokeAction.rejects(err);
                    return Actions.revokeAction('id', 'actor', 'target', 42, 'action', 'token').should.be.rejectedWith(err);
                });
            });
        });
    });
});
