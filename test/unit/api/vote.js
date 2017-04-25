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
    });
});
