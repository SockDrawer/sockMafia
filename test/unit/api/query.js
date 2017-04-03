'use strict';

const chai = require('chai'),
    sinon = require('sinon');

//promise library plugins
chai.use(require('chai-as-promised'));

chai.should();

const Dao = require('../../../src/dao'),
    queryApi = require('../../../src/api/query');

describe('api/query', () => {
    describe('module', () => {
        it('should expose a `bindForum()` function', () => {
            queryApi.should.have.keys(['bindForum']);
        });
    });
    describe('query', () => {
        let sandbox, query, forum, dao;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            forum = {};

            dao = new Dao('test.json');
            query = queryApi.bindForum(forum, dao);
        });
        afterEach(() => sandbox.restore());
        describe('findGame()', () => {
            let stubGetGameByAlias, stubGetGameByTopicId, stubGetGameByChatId;
            beforeEach(() => {
                forum.Topic = function(id) {
                    this.id = id;
                };
                forum.PrivateMessage = function(id) {
                    this.id = id;
                };
                stubGetGameByAlias = sinon.stub(dao, 'getGameByAlias').resolves({});
                stubGetGameByTopicId = sinon.stub(dao, 'getGameByTopicId').resolves({});
                stubGetGameByChatId = sinon.stub(dao, 'getGameByChatId').resolves({});
            });
            it('should be a function in the query API', () => {
                query.should.have.any.key('findGame');
            });
            it('should query via Alias when passed a string', () => {
                const search = `FOOOOOO${Math.random()}`;
                return query.findGame(search).then(() => {
                    stubGetGameByAlias.calledWith(search).should.equal(true);
                });
            });
            it('should resolve to game id for query by alias', () => {
                const id = Math.random();
                stubGetGameByAlias.resolves({id:id});
                return query.findGame('searchTerm').should.become(id);
            });
            it('should query via Topic when passed a Topic', () => {
                const id = Math.random();
                const search = new forum.Topic(id);
                return query.findGame(search).then(() => {
                    stubGetGameByTopicId.calledWith(id).should.equal(true);
                });
            });
            it('should resolve to game id for query by Topic', () => {
                const id = Math.random();
                stubGetGameByTopicId.resolves({id:id});
                return query.findGame(new forum.Topic(4)).should.become(id);
            });
            it('should query via PrivateMessage when passed a PM', () => {
                const id = Math.random();
                const search = new forum.PrivateMessage(id);
                return query.findGame(search).then(() => {
                    stubGetGameByChatId.calledWith(id).should.equal(true);
                });
            });
            it('should resolve to game id for query by PrivateMessage', () => {
                const id = Math.random();
                stubGetGameByChatId.resolves({id:id});
                return query.findGame(new forum.PrivateMessage(4)).should.become(id);
            });
            it('should reject for unrecognized search query', () => {
                const search = {};
                return query.findGame(search).should.be.rejectedWith('E_INVALID_QUERY');
            });
        });
    });
});
