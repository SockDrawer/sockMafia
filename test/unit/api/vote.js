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
    voteApi = require('../../../src/api/vote'),
    utilsApi = require('../../../src/api/utils');

describe('api/vote', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            voteApi.should.have.keys(['bindForum']);
        });
    });
    describe('Vote', () => {
        let sandbox, Vote, forum, dao;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {
                Post: function Post(id) {
                    this.id = id;
                }
            };

            dao = new Dao(':memory:');
            Vote = voteApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('issueVote()', () => {
            let mockGame, mockVoter, mockTarget, mockAction,
                stubGetActiveGame, stubGetLivePlayer, stubGetAction, stubRevokeAction, stubRegisterAction;
            beforeEach(() => {
                mockGame = new MafiaGame({
                    day: Math.floor(Math.random() * 50) + 1
                }, {});
                mockVoter = new MafiaUser({
                    username: `name${Math.random()}`
                }, {});
                mockTarget = new MafiaUser({
                    username: `target${Math.random()}`
                }, {});
                mockAction = new MafiaAction({}, {});
                stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(mockGame);
                stubGetLivePlayer = sandbox.stub(utilsApi, 'getLivePlayer').rejects(new Error('TOO MANY CALLS'));
                stubGetLivePlayer.onFirstCall().resolves(mockVoter);
                stubGetLivePlayer.onSecondCall().resolves(mockTarget);
                stubGetAction = sandbox.stub(mockGame, 'getAction').resolves(null);
                stubRevokeAction = sandbox.stub(mockAction, 'revoke').resolves();
                stubRegisterAction = sandbox.stub(mockGame, 'registerAction').resolves();
            });
            it('should fetch game by getActiveGame()', () => {
                const id = `id${Math.random()}`;
                return Vote.issueVote(id, 'actor', 'target', false, 42).then(() => {
                    stubGetActiveGame.calledWith(id, dao).should.be.true;
                });
            });
            it('should fetch voter by getLivePlayer()', () => {
                const name = `name${Math.random()}`;
                return Vote.issueVote('id', name, 'target', false, 42).then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'actor').should.be.true;
                });
            });
            it('should fetch target by getLivePlayer()', () => {
                const name = `name${Math.random()}`;
                return Vote.issueVote('id', 'actor', name, false, 42).then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should retrieve existing vote', () => {
                return Vote.issueVote('id', 'name', 'target', false, 42).then(() => {
                    stubGetAction.calledOn(mockGame).should.be.true;
                    stubGetAction.calledWith(mockVoter, undefined, 'vote', 'vote[1]', mockGame.day, false).should.be.true;
                });
            });
            it('should not attempt to revoke nonexistant vote', () => {
                stubGetAction.resolves(null);
                return Vote.issueVote('id', 'name', 'target', false, 42).then(() => {
                    stubRevokeAction.called.should.be.false;
                });
            });
            it('should revoke existing vote', () => {
                stubGetAction.resolves(mockAction);
                const id = Math.random();
                return Vote.issueVote('id', 'name', 'target', false, id).then(() => {
                    stubRevokeAction.calledWith(id).should.be.true;
                });
            });
            it('should register new vote', () => {
                const id = Math.random();
                return Vote.issueVote('id', 'name', 'target', false, id).then(() => {
                    stubRegisterAction.calledWith(id, mockVoter, mockTarget, 'vote', 'vote[1]').should.be.true;
                });
            });
            it('should resolve to undefined', () => Vote.issueVote('id', 'actor', 'target', false, 42).should.become(undefined));
            describe('error conditions', () => {
                it('should fetch game by getActiveGame()', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubGetActiveGame.rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
                it('should fetch voter by getLivePlayer()', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubGetLivePlayer.onFirstCall().rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
                it('should fetch target by getLivePlayer()', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubGetLivePlayer.onSecondCall().rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
                it('should retrieve existing vote', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubGetAction.rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
                it('should revoke existing vote', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubGetAction.resolves(mockAction);
                    stubRevokeAction.rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
                it('should register new vote', () => {
                    const err = new Error(`error ${Math.random()}`);
                    stubRegisterAction.rejects(err);
                    return Vote.issueVote('id', 'actor', 'target', false, 42).should.be.rejectedWith(err);
                });
            });
            describe('sourcePost shenanigains', () => {
                it('should accept post id as number', () => {
                    const id = Math.random();
                    return Vote.issueVote('id', 'name', 'target', false, id).then(() => {
                        const postId = stubRegisterAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should accept post id as forum.Post', () => {
                    const id = Math.random();
                    const post = new forum.Post(id);
                    return Vote.issueVote('id', 'name', 'target', false, post).then(() => {
                        const postId = stubRegisterAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should reject invalid typed post id', () => {
                    const id = `post${Math.random()}`;
                    return Vote.issueVote('id', 'name', 'target', false, id).should.be.rejectedWith('E_INVALID_POST');
                });
            });
            describe('alternateVote shenanigains', () => {
                it('normal voter - regular vote', () => {
                    return Vote.issueVote('id', 'name', 'target', false, 42).then(() => {
                        const token = stubRegisterAction.firstCall.args.pop();
                        token.should.equal('vote[1]');
                    });
                });
                it('normal voter - alternate vote', () => {
                    return Vote.issueVote('id', 'name', 'target', true, 42).then(() => {
                        const token = stubRegisterAction.firstCall.args.pop();
                        token.should.equal('vote[1]');
                    });
                });
                it('double voter - regular vote', () => {
                    mockVoter._data.properties.push('doublevoter');
                    return Vote.issueVote('id', 'name', 'target', false, 42).then(() => {
                        const token = stubRegisterAction.firstCall.args.pop();
                        token.should.equal('vote[1]');
                    });
                });
                it('double voter - alternate vote', () => {
                    mockVoter._data.properties.push('doublevoter');
                    return Vote.issueVote('id', 'name', 'target', true, 42).then(() => {
                        const token = stubRegisterAction.firstCall.args.pop();
                        token.should.equal('vote[2]');
                    });
                });
            });
        });
        describe('revokeVote()', () => {
            let mockGame, mockVoter, mockAction, mockAlternateAction,
                stubGetActiveGame, stubGetLivePlayer, stubRegisterAction,
                stubGetAction, stubRevokeAction, stubRevokeAlternateAction;
            beforeEach(() => {
                mockGame = new MafiaGame({
                    day: Math.floor(Math.random() * 50) + 1
                }, {});
                mockVoter = new MafiaUser({
                    username: `name${Math.random()}`
                }, {});
                mockAction = new MafiaAction({}, {});
                mockAlternateAction = new MafiaAction({}, {});
                stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(mockGame);
                stubGetLivePlayer = sandbox.stub(utilsApi, 'getLivePlayer').resolves(mockVoter);
                stubRegisterAction = sandbox.stub(mockGame, 'registerAction').resolves();
                stubGetAction = sandbox.stub(mockGame, 'getAction');
                stubGetAction.onFirstCall().resolves(mockAction);
                stubGetAction.onSecondCall().resolves(mockAlternateAction);
                stubRevokeAction = sandbox.stub(mockAction, 'revoke').resolves();
                stubRevokeAlternateAction = sandbox.stub(mockAlternateAction, 'revoke').resolves();
            });
            it('should fetch game by getActiveGame()', () => {
                const id = `id${Math.random()}`;
                return Vote.nullifyVote(id, 'actor', 42).then(() => {
                    stubGetActiveGame.calledWith(id, dao).should.be.true;
                });
            });
            it('should fetch voter by getLivePlayer()', () => {
                const name = `name${Math.random()}`;
                return Vote.nullifyVote('id', name, 42).then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'actor').should.be.true;
                });
            });
            it('should fetch primary vote', () => {
                const day = Math.random();
                mockGame._data.day = day;
                return Vote.nullifyVote('id', 'name', 42).then(() => {
                    stubGetAction.calledWith(mockVoter, undefined, 'vote', 'vote[1]', day, false).should.be.true;
                });
            });
            it('should revoke primary vote', () => {
                const id = Math.random();
                return Vote.nullifyVote('id', 'name', id).then(() => {
                    stubRevokeAction.calledWith(id).should.be.true;
                });
            });
            it('should not revoke missing primary vote', () => {
                const id = Math.random();
                stubGetAction.onFirstCall().resolves(null);
                return Vote.nullifyVote('id', 'name', id).then(() => {
                    stubRevokeAction.called.should.be.false;
                });
            });
            it('should fetch secondary post', () => {
                const day = Math.random();
                mockGame._data.day = day;
                return Vote.nullifyVote('id', 'name', 42).then(() => {
                    stubGetAction.calledWith(mockVoter, undefined, 'vote', 'vote[2]', day, false).should.be.true;
                });
            });
            it('should revoke secondary vote', () => {
                const id = Math.random();
                return Vote.nullifyVote('id', 'name', id).then(() => {
                    stubRevokeAlternateAction.calledWith(id).should.be.true;
                });
            });
            it('should not revoke missing secondary vote', () => {
                const id = Math.random();
                stubGetAction.onSecondCall().resolves(null);
                return Vote.nullifyVote('id', 'name', id).then(() => {
                    stubRevokeAlternateAction.called.should.be.false;
                });
            });
            it('should issue null vote as primary vote', () => {
                const id = Math.random();
                return Vote.nullifyVote('id', 'name', id).then(() => {
                    stubRegisterAction.calledWith(id, mockVoter, null, 'vote', 'vote[1]');
                });
            });
            it('should resolve to undefined', () => {
                return Vote.nullifyVote('id', 'name', 42).should.become(undefined);
            });
            describe('sourcePost shenanigains', () => {
                it('should accept post id as number', () => {
                    const id = Math.random();
                    return Vote.nullifyVote('id', 'name', id).then(() => {
                        const postId = stubRevokeAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should accept post id as forum.Post', () => {
                    const id = Math.random();
                    const post = new forum.Post(id);
                    return Vote.nullifyVote('id', 'name', post).then(() => {
                        const postId = stubRevokeAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should reject invalid typed post id', () => {
                    const id = `post${Math.random()}`;
                    return Vote.nullifyVote('id', 'name', id).should.be.rejectedWith('E_INVALID_POST');
                });
            });
            describe('error conditions', () => {
                it('should reject when game retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetActiveGame.rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when user retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetLivePlayer.rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when primary vote retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetAction.onFirstCall().rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when secondary vote retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetAction.onSecondCall().rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when primary vote revocation fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubRevokeAction.rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when secondary vote revocation fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubRevokeAlternateAction.rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
                it('should reject when null vote registration fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubRegisterAction.rejects(err);
                    return Vote.nullifyVote('id', 'name', 42).should.be.rejectedWith(err);
                });
            });
        });
        describe('revokeVote()', () => {
            let mockGame, mockVoter, mockTarget, mockAction,
                stubGetActiveGame, stubGetLivePlayer, stubGetUser, stubGetAction, stubRevokeAction;
            beforeEach(() => {
                mockGame = new MafiaGame({
                    day: Math.floor(Math.random() * 50) + 1
                }, {});
                mockVoter = new MafiaUser({
                    username: `name${Math.random()}`
                }, {});
                mockTarget = new MafiaUser({
                    username: `target${Math.random()}`
                }, {});
                mockAction = new MafiaAction({}, {});
                stubGetActiveGame = sandbox.stub(utilsApi, 'getActiveGame').resolves(mockGame);
                stubGetLivePlayer = sandbox.stub(utilsApi, 'getLivePlayer').resolves(mockVoter);
                stubGetUser = sandbox.stub(utilsApi, 'getUser').resolves(mockTarget);
                stubGetAction = sandbox.stub(mockGame, 'getAction').resolves(mockAction);
                stubRevokeAction = sandbox.stub(mockAction, 'revoke').resolves();
            });
            it('should fetch game by getActiveGame()', () => {
                const id = `id${Math.random()}`;
                return Vote.revokeVote(id, 'actor', 'target', 42).then(() => {
                    stubGetActiveGame.calledWith(id, dao).should.be.true;
                });
            });
            it('should fetch voter by getLivePlayer()', () => {
                const name = `name${Math.random()}`;
                return Vote.revokeVote('id', name, 'target', 42).then(() => {
                    stubGetLivePlayer.calledWith(name, mockGame, forum, 'actor').should.be.true;
                });
            });
            it('should fetch target by getUser()', () => {
                const name = `name${Math.random()}`;
                return Vote.revokeVote('id', 'actor', name, 42).then(() => {
                    stubGetUser.calledWith(name, mockGame, forum, 'target').should.be.true;
                });
            });
            it('should allow blank target', () => {
                return Vote.revokeVote('id', 'actor', '', 42).then(() => {
                    stubGetUser.called.should.be.false;
                    stubGetAction.calledWith(mockVoter, undefined, 'vote', undefined, mockGame.day, false).should.be.true;
                });
            });
            it('should allow omitted target', () => {
                return Vote.revokeVote('id', 'actor', undefined, 42).then(() => {
                    stubGetUser.called.should.be.false;
                    stubGetAction.calledWith(mockVoter, undefined, 'vote', undefined, mockGame.day, false).should.be.true;
                });
            });
            it('should retrieve existing vote', () => {
                return Vote.revokeVote('id', 'name', 'target', 42).then(() => {
                    stubGetAction.calledOn(mockGame).should.be.true;
                    stubGetAction.calledWith(mockVoter, mockTarget, 'vote', undefined, mockGame.day, false).should.be.true;
                });
            });
            it('should revoke existing vote', () => {
                const post = Math.random();
                return Vote.revokeVote('id', 'name', 'target', post).then(() => {
                    stubRevokeAction.calledWith(post).should.be.true;
                });
            });
            it('should resolve to undefined', () => {
                return Vote.revokeVote('id', 'name', 'target', 42).should.become(undefined);
            });
            describe('sourcePost shenanigains', () => {
                it('should accept post id as number', () => {
                    const id = Math.random();
                    return Vote.revokeVote('id', 'name', 'target', id).then(() => {
                        const postId = stubRevokeAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should accept post id as forum.Post', () => {
                    const id = Math.random();
                    const post = new forum.Post(id);
                    return Vote.revokeVote('id', 'name', 'target', post).then(() => {
                        const postId = stubRevokeAction.firstCall.args.shift();
                        postId.should.equal(id);
                    });
                });
                it('should reject invalid typed post id', () => {
                    const id = `post${Math.random()}`;
                    return Vote.revokeVote('id', 'name', 'target', id).should.be.rejectedWith('E_INVALID_POST');
                });
            });
            describe('error conditions', () => {
                it('should reject when game retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetActiveGame.rejects(err);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith(err);
                });
                it('should reject when actor fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetLivePlayer.rejects(err);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith(err);
                });
                it('should reject when target retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetUser.rejects(err);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith(err);
                });
                it('should reject when action retrieval fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubGetAction.rejects(err);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith(err);
                });
                it('should reject when vote revocation fails', () => {
                    const err = new Error(`err${Math.random()}`);
                    stubRevokeAction.rejects(err);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith(err);
                });
                it('should reject with no existing vote', () => {
                    stubGetAction.resolves(null);
                    return Vote.revokeVote('id', 'name', undefined, 42).should.be.rejectedWith('E_NO_VOTE');
                });
                it('should reject with no existing targeted vote', () => {
                    stubGetAction.resolves(null);
                    return Vote.revokeVote('id', 'name', 'target', 42).should.be.rejectedWith('E_NO_TARGET_VOTE');
                });
            });
        });
    });
});
