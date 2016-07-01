'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.should();

const PlayerController = require('../../src/player_controller');
const ModController = require('../../src/mod_controller');
const DAO = require('../../src/dao');
const view = require('../../src/view.js');

const testConfig = {
	db: ':memory:',

};

describe('MafiaBot', function () {
	this.timeout(50000);
	let sandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		//Stub view methods for output trapping
		sandbox.spy(view, 'respondInThread');
		sandbox.spy(view, 'reportError');
		sandbox.spy(view, 'respondWithTemplate');
		sandbox.spy(view, 'respond');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('Voting', function () {
		let dao, playerController, game;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			return dao.createGame(1, 'Game 1')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.newDay());

		});

		after(() => {
			dao.getGameByTopicId.restore();
		});

		it('Should list players', () => {
			const command = {
				args: [''],
				input: '!list-players',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 4}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.listPlayersHandler(command).then(() => {

				command.reply.called.should.equal(true);
				command.reply.firstCall.args[0].should.include('accalia');
				command.reply.firstCall.args[0].should.include('dreikin');
				command.reply.firstCall.args[0].should.include('yamikuronue');
				command.reply.firstCall.args[0].should.include('tehninja');
			});
		});

		it('Should allow one player to vote for another', () => {
			const command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 5}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.firstCall.args[0].should.include('@yamikuronue voted for @accalia');
			});
		});

		it('Should prevent invalid voters', () => {
			const command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 6}),
				getUser: () => Promise.resolve({username: 'banana'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				game.registerAction.called.should.equal(false);
			});
		});

		it('Should prevent invalid targets', () => {
			const command = {
				args: ['@banana'],
				input: '!vote @banana',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 7}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				game.registerAction.called.should.equal(false);
			});
		});

		it('Should allow changing targets', () => {
			const command = {
				args: ['@dreikin'],
				input: '!vote @dreikin',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 8}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.firstCall.args[0].should.include('@yamikuronue voted for @dreikin');
			});
		});

		it('Should allow unvoting', () => {
			const command = {
				args: [],
				input: '!unvote',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 9}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'revokeAction');
			return playerController.unvoteHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				game.revokeAction.called.should.equal(true);
				view.respond.firstCall.args[1].should.include('@yamikuronue unvoted');
			});
		});

		it('Should allow revoting', () => {
			const command = {
				args: ['@dreikin'],
				input: '!vote @dreikin',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 10}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.firstCall.args[0].should.include('@yamikuronue voted for @dreikin');

				//Verify that the unvote reduced the vote count so Dreikin is still alive
				game.getPlayer('dreikin').isAlive.should.equal(true);
			});
		});

		it('Should allow no lynching', () => {
			const command = {
				post: {
					username: 'tehninja',
					'topic_id': 1,
					'post_number': 11
				},
				args: [''],
				input: '!noLynch',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 11}),
				getUser: () => Promise.resolve({username: 'tehninja'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.nolynchHandler(command).then(() => {
				game.registerAction.called.should.equal(true);

				view.respond.called.should.equal(true);
				command.reply.called.should.be.true;
				command.reply.firstCall.args[0].should.include('@tehninja voted to not lynch');
			});
		});

		it('Should allow un-nolynching', () => {
			const command = {
				post: {
					username: 'tehninja',
					'topic_id': 1,
					'post_number': 12
				},
				args: ['@dreikin'],
				input: '!vote @dreikin',
				reply: sandbox.stub().resolves(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 12}),
				getUser: () => Promise.resolve({username: 'tehninja'}),
			};


			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.called.should.be.true;
				//command.reply.firstCall.args[0].should.include('@tehninja voted for @dreikin');
			});
		});

		/*TODO: No-lynch*/

		it('Should auto-lynch', () => {
			const command = {
				args: ['@dreikin'],
				input: '!vote @dreikin',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 1}),
				getPost: () => Promise.resolve({id: 13}),
				getUser: () => Promise.resolve({username: 'accalia'}),
			};
			//Spies
			sandbox.spy(game, 'registerAction');
			return playerController.voteHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.called.should.be.true;
				command.reply.firstCall.args[0].should.include('@accalia voted for @dreikin');
				game.getPlayer('dreikin').isAlive.should.equal(false);
			});
		});
	});


	describe('Vote bug: revoked actions', function () {
		let dao, playerController, game;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			return dao.createGame(2, 'Game 2')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.newDay());
		});

		after(() => {
			dao.getGameByTopicId.restore();
		});

		it('Should not reproduce the Onyx revote bug', () => {
			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 1}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return playerController.voteHandler(command).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted for @accalia');

				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 2}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Then, unvote
				view.respond.reset();
				view.reportError.reset();
				game.revokeAction.reset();
				return playerController.unvoteHandler(command);
			}).then(() => {
				view.reportError.called.should.equal(false);
				game.revokeAction.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue unvoted');

				command = {
					args: ['@accalia'],
					input: '!vote @accalia',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 3}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Vote for the same person again
				view.respond.reset();
				view.reportError.reset();
				game.registerAction.reset();
				return playerController.voteHandler(command);
			}).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted for @accalia');

				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 4}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Then unvote
				view.respond.reset();
				view.reportError.reset();
				game.revokeAction.reset();
				return playerController.unvoteHandler(command);
			}).then(() => {
				view.reportError.called.should.equal(false);
				game.revokeAction.called.should.equal(true);

				command = {
					args: [],
					input: '!list-players',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 5}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

				view.respond.reset();
				view.reportError.reset();
				return playerController.listVotesHandler(command);
			}).then(() => {
				const data = view.respondWithTemplate.firstCall.args[1];
				data.votes.accalia.votes[0].postId.should.equal(1);
				data.votes.accalia.votes[0].isCurrent.should.be.false;
				data.votes.accalia.votes[0].revokedId.should.equal(2);

				data.votes.accalia.votes[1].postId.should.equal(3);
				data.votes.accalia.votes[1].isCurrent.should.be.false;
				data.votes.accalia.votes[1].revokedId.should.equal(4);
			});
		});

		it('Should not reproduce the Onyx revote bug 2', () => {
			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 6}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return game.newDay().then(() => playerController.voteHandler(command))
			.then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted for @accalia');

				command = {
					args: [],
					input: '!nolynch',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 7}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Then, nolynch
				view.respond.reset();
				view.reportError.reset();
				game.registerAction.reset();
				return playerController.nolynchHandler(command);
			}).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted to not lynch');

				command = {
					args: ['@accalia'],
					input: '!vote @accalia',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 8}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Vote for the same person again
				view.respond.reset();
				view.reportError.reset();
				game.registerAction.reset();
				return playerController.voteHandler(command);
			}).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted for @accalia');

				command = {
					args: [],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 9}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

			//Then unvote
				view.respond.reset();
				view.reportError.reset();
				game.revokeAction.reset();
				return playerController.unvoteHandler(command);
			}).then(() => {
				view.reportError.called.should.equal(false);
				game.revokeAction.called.should.equal(true);

				command = {
					args: [],
					input: '!list-players',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 10}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

				view.respond.reset();
				view.reportError.reset();
				return playerController.listVotesHandler(command);
			}).then(() => {
				const data = view.respondWithTemplate.firstCall.args[1];
				data.votes.accalia.votes[0].postId.should.equal(6);
				data.votes.accalia.votes[0].isCurrent.should.be.false;
				data.votes.accalia.votes[0].revokedId.should.equal(7);

				data.votes.accalia.votes[1].postId.should.equal(8);
				data.votes.accalia.votes[1].isCurrent.should.be.false;
				data.votes.accalia.votes[1].revokedId.should.equal(9);
			});
		});

	});

	describe('Vote bug: no-lynch autolynch', function () {
		let dao, playerController, game;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			return dao.createGame(2, 'Game autolynch bug')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.newDay());
		});

		after(() => {
			dao.getGameByTopicId.restore();
		});

		it('Should not reproduce the autolynch', () => {
			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 1}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return playerController.voteHandler(command).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@yamikuronue voted for @accalia');

				command = {
					args: [],
					input: '!no-lynch',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 2}),
					getUser: () => Promise.resolve({username: 'dreikin'}),
				};

			//Then, nolynch
				view.respond.reset();
				view.reportError.reset();
				game.revokeAction.reset();
				return playerController.nolynchHandler(command);
			}).then(() => {
				view.reportError.called.should.equal(false);
				game.registerAction.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@dreikin voted to not lynch');

				command = {
					args: ['@accalia'],
					input: '!vote @accalia',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 3}),
					getUser: () => Promise.resolve({username: 'tehninja'}),
				};

			//Vote for the original
				view.respond.reset();
				view.reportError.reset();
				game.registerAction.reset();
				return playerController.voteHandler(command);
			}).then(() => {
				game.registerAction.called.should.equal(true);

				command.reply.called.should.equal(true);
				command.reply.lastCall.args[0].should.include('@tehninja voted for @accalia');
			});
		});



	});

	describe('Vote history', () => {
		let dao, playerController, game, fakeFormatter;

		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};

			fakeFormatter = {
				urlForTopic: (topicId, slug, postId) => {
					return '/t/' + slug + '/' + topicId + '/' + postId;
				},
				urlForPost: (postId) => {
					return '/p/' + postId;
				}
			};

			view.activate({Format: fakeFormatter});

			return dao.createGame(2, 'Game 2')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.newDay());
		});

		after(() => {
			dao.getGameByTopicId.restore();
		});

		it('Should list one vote', () => {

			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 1}),
				getUser: () => Promise.resolve({username: 'yamikuronue'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return playerController.voteHandler(command).then(() => {
				command = {
					args: [],
					input: '!list-players',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 2}),
					getUser: () => Promise.resolve({username: 'yamikuronue'}),
				};

				view.reportError.reset();
				return playerController.listVotesHandler(command);
			}).then(() => {
				view.reportError.called.should.be.false;
				command.reply.called.should.be.true;

				const output = command.reply.firstCall.args[0];
				output.should.include('<td><b>accalia');
				output.should.include('<a href="/p/1"><b>yamikuronue</b></a>');
			});
		});

		it('Should list two votes', () => {

			let command = {
				args: ['@accalia'],
				input: '!vote @accalia',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 3}),
				getUser: () => Promise.resolve({username: 'dreikin'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return playerController.voteHandler(command).then(() => {
				command = {
					args: [],
					input: '!list-players',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 4}),
					getUser: () => Promise.resolve({username: 'dreikin'}),
				};

				view.reportError.reset();
				return playerController.listVotesHandler(command);
			}).then(() => {
				view.reportError.called.should.be.false;
				command.reply.called.should.be.true;

				const output = command.reply.firstCall.args[0];
				output.should.include('<td><b>accalia');
				output.should.include('<a href="/p/1"><b>yamikuronue</b></a>');
				output.should.include('<a href="/p/3"><b>dreikin</b></a>');
			});
		});

		it('Should list revoked votes', () => {

			let command = {
				args: [''],
				input: '!unvote',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 2}),
				getPost: () => Promise.resolve({id: 5}),
				getUser: () => Promise.resolve({username: 'dreikin'}),
			};

			//Spies
			sandbox.spy(game, 'registerAction');
			sandbox.spy(game, 'revokeAction');

			//First, register a vote
			return playerController.unvoteHandler(command).then(() => {
				command = {
					args: [],
					input: '!list-votes',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 2}),
					getPost: () => Promise.resolve({id: 6}),
					getUser: () => Promise.resolve({username: 'dreikin'}),
				};

				view.reportError.reset();
				return playerController.listVotesHandler(command);
			}).then(() => {
				view.reportError.called.should.be.false;
				command.reply.called.should.be.true;

				const output = command.reply.firstCall.args[0];
				output.should.include('<td><b>accalia');
				output.should.include('<a href="/p/1"><b>yamikuronue</b></a>');
				output.should.include('<a href="/p/3"><s>dreikin</s></a> <a href="/p/5">[X]</a>');
			});
		});

	});

/*	describe('Game moderation', () => {

		it('Should allow game creation', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 1
				},
				args: ['bushidoMafia'],
				input: '!prepare bushidoMafia'
			};
			sandbox.spy(DAO, 'addGame');

			return modController.prepHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.addGame.called.should.equal(true);
				view.respond.firstCall.args[1].should.include('Game "bushidoMafia" created! The mod is @ModdyMcModerson');
			});
		});

		it('Should only allow game creation once', () => {
			const command = {
				post: {
					username: 'dreikin',
					'topic_id': 2,
					'post_number': 2
				},
				args: ['bushidoMafia'],
				input: '!prepare bushidoMafia'
			};

			sandbox.spy(DAO, 'addGame');

			return modController.prepHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				DAO.addGame.called.should.equal(false);
			});
		});

		it('Should allow joining', () => {
			const command = {
				post: {
					username: 'yamikuronue',
					'topic_id': 2,
					'post_number': 3
				},
				args: [],
				input: '!join'
			};
			sandbox.spy(DAO, 'addPlayerToGame');

			return playerController.joinHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.addPlayerToGame.called.should.equal(true);
				view.respond.firstCall.args[1].should.include('Welcome to the game, @yamikuronue');
			});
		});

		it('Should only allow joining once', () => {
			const command = {
				post: {
					username: 'yamikuronue',
					'topic_id': 2,
					'post_number': 4
				},
				args: [],
				input: '!join'
			};
			sandbox.spy(DAO, 'addPlayerToGame');

			return playerController.joinHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				DAO.addPlayerToGame.called.should.equal(false);
			});
		});

		it('Should allow player properties to be set', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 4
				},
				args: ['@yamikuronue', 'loved'],
				input: '!set @yamikuronue loved'
			};
			sandbox.spy(DAO, 'addPropertyToPlayer');

			return modController.setHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.addPropertyToPlayer.called.should.equal(true);
				DAO.addPropertyToPlayer.firstCall.args[1].should.equal('yamikuronue');
				DAO.addPropertyToPlayer.firstCall.args[2].should.equal('loved');
				view.respondWithTemplate.called.should.equal(true);
			});
		});

		it('Should not allow player properties to be set on non-players', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 5
				},
				args: ['@accalia', 'loved'],
				input: '!set @accalia loved'
			};
			sandbox.spy(DAO, 'addPropertyToPlayer');

			return modController.setHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				DAO.addPropertyToPlayer.called.should.equal(false);
				view.respondWithTemplate.called.should.equal(false);
			});

		});

		it('Should not allow player properties to be set by non-mods', () => {
			const command = {
				post: {
					username: 'yamikuronue',
					'topic_id': 2,
					'post_number': 5
				},
				args: ['@yamikuronue', 'loved'],
				input: '!set @yamikuronue loved'
			};
			sandbox.spy(DAO, 'addPropertyToPlayer');

			return modController.setHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				DAO.addPropertyToPlayer.called.should.equal(false);
				view.respondWithTemplate.called.should.equal(false);
			});

		});

		it('Should not allow the game to be started by non-mods', () => {
			const command = {
				post: {
					username: 'yamikuronue',
					'topic_id': 2,
					'post_number': 6
				},
				args: [],
				input: '!start'
			};
			sandbox.spy(DAO, 'setGameStatus');
			sandbox.spy(DAO, 'incrementDay');
			sandbox.spy(DAO, 'setCurrentTime');


			return modController.startHandler(command).then(() => {
				view.reportError.called.should.equal(true);
				DAO.setGameStatus.called.should.equal(false);
				DAO.incrementDay.called.should.equal(false);
			});
		});

		it('Should allow the game to be started', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 6
				},
				args: [],
				input: '!start'
			};
			sandbox.spy(DAO, 'setGameStatus');
			sandbox.spy(DAO, 'incrementDay');
			sandbox.spy(DAO, 'setCurrentTime');


			return DAO.addPlayerToGame(2, 'accalia').then(() => DAO.addPlayerToGame(2, 'dreikin'))
				.then(() => modController.startHandler(command))
				.then(() => {
					view.reportError.called.should.equal(false);
					DAO.setGameStatus.calledWith(2, 'running').should.equal(true);
					DAO.setCurrentTime.calledWith(2, DAO.gameTime.day).should.equal(true);
					DAO.incrementDay.called.should.equal(true);
				});
		});

		it('Should change to night', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 7
				},
				args: [],
				input: '!next-phase'
			};
			sandbox.spy(DAO, 'incrementDay');
			sandbox.spy(DAO, 'setCurrentTime');


			return modController.dayHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.setCurrentTime.calledWith(2, DAO.gameTime.night).should.equal(true);
				DAO.incrementDay.called.should.equal(false);
			});
		});

		it('Should change to day', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 8
				},
				args: [],
				input: '!new-day'
			};
			sandbox.spy(DAO, 'incrementDay');
			sandbox.spy(DAO, 'setCurrentTime');


			return modController.dayHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.setCurrentTime.calledWith(2, DAO.gameTime.day).should.equal(true);
				DAO.incrementDay.called.should.equal(true);
			});
		});

		it('Should kill people', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 9
				},
				args: ['@yamikuronue'],
				input: '!kill @yamikuronue'
			};
			sandbox.spy(DAO, 'killPlayer');
			sandbox.spy(DAO, 'incrementDay');
			sandbox.spy(DAO, 'setCurrentTime');


			return modController.killHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.killPlayer.calledWith(2, 'yamikuronue').should.equal(true);
				DAO.incrementDay.called.should.equal(false);
				DAO.setCurrentTime.called.should.equal(false);
			});
		});

		it('Should end the game', () => {
			const command = {
				post: {
					username: 'ModdyMcModerson',
					'topic_id': 2,
					'post_number': 10
				},
				args: ['@yamikuronue'],
				input: '!kill @yamikuronue'
			};
			sandbox.spy(DAO, 'setGameStatus');
			sandbox.spy(playerController, 'listAllPlayersHandler');


			return modController.finishHandler(command).then(() => {
				view.reportError.called.should.equal(false);
				DAO.setGameStatus.calledWith(2, 'finished').should.equal(true);
				playerController.listAllPlayersHandler.called.should.equal(true);
			});
		});
	});
	*/

	/*
	describe('Special voting', () => {
		let dao, playerController, game;
		
		describe('Doublevoting', () => {
			before(() => {
				//Set up the database
				dao = new DAO(':memory:');
				playerController = new PlayerController(dao, testConfig);
				playerController.formatter = {
					urlForPost: () => '',
					quoteText: (input) => input
				};
				
	
				return dao.createGame(2, 'Game 2')
					.then((g) => {
						game = g;
						sinon.stub(dao, 'getGameByTopicId').resolves(game);
						return game.addPlayer('yamikuronue');
					})
					.then(() => game.addPlayer('accalia'))
					.then(() => game.addPlayer('dreikin'))
					.then(() => game.addPlayer('tehNinja'))
					.then(() => game.getPlayer('tehNinja'))
					.then((ninja) => ninja.addProperty('doublevoter'))
					.then(() => game.newDay());
			});
	
			after(() => {
				dao.getGameByTopicId.restore();
			});
			
			it('Should allow two votes', () => {
				let command = {
					args: ['@accalia'],
					input: '!for @accalia',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 4}),
					getPost: () => Promise.resolve({id: 1}),
					getUser: () => Promise.resolve({username: 'tehNinja'}),
				};
				
				sandbox.spy(game, 'registerAction');
			
				return playerController.forHandler(command).then(() => {
					game.registerAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					command.reply.firstCall.args[0].should.include('@tehNinja voted for @accalia');
					
					command = {
						args: ['@dreikin'],
						input: '!vote @dreikin',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 2}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
		
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.voteHandler(command);
				}).then(() => {
					game.registerAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					command.reply.firstCall.args[0].should.include('@tehNinja voted for @dreikin');
					
					command = {
						args: [''],
						input: '!list-votes',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 3}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
					
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.listVotesHandler(command);
				}).then(() => {
					view.reportError.called.should.be.false;
					command.reply.called.should.be.true;
					
					//List both votes
					const output = command.reply.firstCall.args[0];
					output.should.include('<td><b>accalia');
					output.should.include('<a href="/p/1"><b>tehNinja</b></a>');
					output.should.include('<a href="/p/2"><b>tehNinja</b></a>');
				});
			});
			
			it('Should retract one of the votes', () => {
				let command = {
					args: ['@dreikin'],
					input: '!for @dreikin',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 4}),
					getPost: () => Promise.resolve({id: 5}),
					getUser: () => Promise.resolve({username: 'tehNinja'}),
				};
				
				sandbox.spy(game, 'registerAction');
			
				return playerController.forHandler(command).then(() => {
					game.registerAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					command.reply.firstCall.args[0].should.include('@tehNinja voted for @dreikin');
					command = {
						args: [''],
						input: '!list-votes',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 6}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
					
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.listVotesHandler(command);
				}).then(() => {
					view.reportError.called.should.be.false;
					command.reply.called.should.be.true;
					
					//List both votes
					const output = command.reply.firstCall.args[0];
					output.should.include('<td><b>accalia');
					output.should.include('<a href="/p/5"><b>tehNinja</b></a>');
					output.should.include('<a href="/p/1"><s>tehNinja</s></a> <a href="/p/5">[X]</a>'); //retracted vote
				});
			});
			
			it('Should allow two votes for the same person', () => {
				let command = {
					args: ['@yamikuronue'],
					input: '!for @yamikuronue',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 4}),
					getPost: () => Promise.resolve({id: 7}),
					getUser: () => Promise.resolve({username: 'tehNinja'}),
				};
				
				sandbox.spy(game, 'registerAction');
			
				return playerController.forHandler(command).then(() => {
					game.registerAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					command.reply.firstCall.args[0].should.include('@tehNinja voted for @yamikuronue');
					
					command = {
						args: ['@yamikuronue'],
						input: '!vote @yamikuronue',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 8}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
		
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.voteHandler(command);
				}).then(() => {
					game.registerAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					command.reply.firstCall.args[0].should.include('@tehNinja voted for @yamikuronue');
					
					command = {
						args: [''],
						input: '!list-votes',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 9}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
					
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.listVotesHandler(command);
				}).then(() => {
					view.reportError.called.should.be.false;
					command.reply.called.should.be.true;
					
					//List all votes
					const output = command.reply.firstCall.args[0];
					output.should.include('<td><b>yamikuronue');
					output.should.include('<a href="/p/1"><s>tehNinja</s></a> <a href="/p/5">[X]</a>');
					output.should.include('<a href="/p/2"><s>tehNinja</s></a> <a href="/p/8">[X]</a>');
					output.should.include('<a href="/p/5"><s>tehNinja</s></a> <a href="/p/7">[X]</a>');
					output.should.include('<a href="/p/7"><b>tehNinja</b></a>');
					output.should.include('<a href="/p/8"><b>tehNinja</b></a>');
				});
			});
			
			it('Should unvote everything', () => {
				let command = {
					args: [''],
					input: '!unvote',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 4}),
					getPost: () => Promise.resolve({id: 10}),
					getUser: () => Promise.resolve({username: 'tehNinja'}),
				};
				
				sandbox.spy(game, 'registerAction');
				sandbox.spy(game, 'revokeAction');
			
				return playerController.unvoteHandler(command).then(() => {
					game.revokeAction.called.should.equal(true);
	
					command.reply.called.should.equal(true);
					
					command = {
						args: [''],
						input: '!list-votes',
						reply: sandbox.stub(),
						getTopic: () => Promise.resolve({id: 4}),
						getPost: () => Promise.resolve({id: 11}),
						getUser: () => Promise.resolve({username: 'tehNinja'}),
					};
		
					view.respond.reset();
					view.reportError.reset();
					game.registerAction.reset();
					return playerController.listVotesHandler(command);
				}).then(() => {
					view.reportError.called.should.be.false;
					command.reply.called.should.be.true;
					
					//List all votes
					const output = command.reply.firstCall.args[0];
					output.should.include('<td><b>yamikuronue');
					output.should.include('<a href="/p/1"><s>tehNinja</s></a> <a href="/p/5">[X]</a>');
					output.should.include('<a href="/p/2"><s>tehNinja</s></a> <a href="/p/8">[X]</a>');
					output.should.include('<a href="/p/5"><s>tehNinja</s></a> <a href="/p/7">[X]</a>');
					output.should.include('<a href="/p/7"><s>tehNinja</s></a> <a href="/p/10">[X]</a>');
					output.should.include('<a href="/p/8"><s>tehNinja</s></a> <a href="/p/10">[X]</a>');
				});
			});
		});
	});
	
	describe('Night Actions', () => {
		let dao, playerController, modController, game, fakeFormatter;
		
		before(() => {
			//Set up the database
			dao = new DAO(':memory:');
			playerController = new PlayerController(dao, testConfig);
			playerController.formatter = {
				urlForPost: () => '',
				quoteText: (input) => input
			};
			
			modController = new ModController(dao, testConfig);
			
			fakeFormatter = {
				urlForTopic: (topicId, slug, postId) => {
					return '/t/' + slug + '/' + topicId + '/' + postId;
				},
				urlForPost: (postId) => {
					return '/p/' + postId;
				}
			};
			
			view.activate({Format: fakeFormatter});

			return dao.createGame(3, 'Game 3')
				.then((g) => {
					game = g;
					sinon.stub(dao, 'getGameByTopicId').resolves(game);
					return game.addPlayer('yamikuronue');
				})
				.then(() => game.addPlayer('accalia'))
				.then(() => game.addPlayer('dreikin'))
				.then(() => game.addPlayer('tehninja'))
				.then(() => game.addModerator('God'))
				.then(() => game.newDay())
				.then(() => game.nextPhase()); //Make it night
		});
		
		it('Should allow setting of properties', () => {
			let command = {
				args: ['accalia', 'scum', 'in', '3'],
				line: '!set @accalia scum in 3',
				reply: sandbox.stub(),
				getTopic: () => Promise.resolve({id: 12}),
				getPost: () => Promise.resolve({id: 1}),
				getUser: () => Promise.resolve({username: 'God'}),
			};
		
			return modController.setHandler(command).then(() => {
				game.getPlayer('accalia').hasProperty('scum').should.be.true;
				
				command = {
					args: ['@yamikuronue', 'scum2', 'in', '3'],
					line: '!set @yamikuronue scum2 in 3',
					reply: sandbox.stub(),
					getTopic: () => Promise.resolve({id: 12}),
					getPost: () => Promise.resolve({id: 2}),
					getUser: () => Promise.resolve({username: 'God'}),
				};
		
				view.respond.reset();
				view.reportError.reset();
				return modController.setHandler(command);
			}).then(() => {
				game.getPlayer('yamikuronue').hasProperty('scum2').should.be.true;
				game.getPlayer('yamikuronue').hasProperty('scum').should.be.false;
			});
		});
	});
	*/
});
