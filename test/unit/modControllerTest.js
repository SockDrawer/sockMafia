'use strict';
/*globals describe, it, beforeEach, afterEach*/

const chai = require('chai'),
	sinon = require('sinon');

//promise library plugins
require('chai-as-promised');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));
chai.should();

const ModController = require('../../src/mod_controller');
const view = require('../../src/view.js');


describe('mod controller', () => {

	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		sandbox.stub(view, 'respond').resolves();
		sandbox.stub(view, 'respondInThread').resolves();
		sandbox.stub(view, 'respondWithTemplate').resolves();
		sandbox.stub(view, 'respondWithTemplateInThread').resolves();
		sandbox.stub(view, 'reportError').resolves();

	});
	afterEach(() => {
		sandbox.restore();
	});

	describe('getGame', () => {
		let mockGame, mockdao, modController;

		beforeEach(() => {
			mockGame = {
				getAllPlayers: () => 1,
				killPlayer: () => 1,
				nextPhase: () => 1,
				registerAction: () => Promise.resolve('Ok'),
				topicId: 12,
				isActive: true,
				isDay: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame),
				getGameByName: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao, null);
		});

		it('should get a game by chat id', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: -1
				}),
				parent: {
					ids: {
						topic: -1,
						room: 12
					}
				},
				args: []
			};
			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByChatId');
			return modController.getGame(command).then((game) => {
				game.should.deep.equal(mockGame);
				mockdao.getGameByChatId.calledWith(12).should.be.true;
			});
		});

		it('should get a game by topic id', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 1234
				}),
				parent: {
					ids: {
						topic: 1234,
						chat: -1
					}
				},
				args: []
			};
			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByChatId');
			return modController.getGame(command).then((game) => {
				game.should.deep.equal(mockGame);
				mockdao.getGameByTopicId.calledWith(1234).should.be.true;
			});
		});

		it('should get a game by name', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 1234
				}),
				parent: {
					ids: [12]
				},
				args: [
					'set',
					'accalia',
					'loved',
					'in',
					'testMafia'
				]
			};
			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByChatId');
			sandbox.spy(mockdao, 'getGameByName');
			return modController.getGame(command).then((game) => {
				game.should.deep.equal(mockGame);
				mockdao.getGameByName.calledWith('testMafia').should.be.true;
			});
		});

	});

	describe('kill()', () => {
		let mockGame, mockUser, mockTarget, mockdao, modController;

		beforeEach(() => {
			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => 1,
				killPlayer: () => Promise.resolve(),
				nextPhase: () => 1,
				getActions: () => 1,
				getPlayer: () => mockTarget,
				getModerator: () => mockUser,
				topicId: 12
			};

			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};

			mockTarget = {
				username: 'Margaret',
				getPlayerProperty: () => [],
				isAlive: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});


		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			mockUser.isModerator = false;
			sandbox.stub(mockGame, 'getModerator').throws();

			return modController.killHandler(command).then(() => {
				const output = view.reportError.getCall(0).args[2];
				output.should.include('You are not a moderator');
			});
		});

		it('Should require 1 arg', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockGame, 'killPlayer');

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.called.should.be.false;
				view.reportError.called.should.be.true;
				const output = view.reportError.getCall(0).args[2];
				output.toString().should.include('Please select a target to kill');
			});
		});

		it('Should not kill dead players', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			mockTarget.isAlive = false;
			sandbox.spy(mockGame, 'killPlayer');

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.called.should.be.false;
				const output = view.reportError.getCall(0).args[2];
				output.should.include('Target not alive');
			});
		});

		it('Should not kill players not in the game', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockGame, 'getPlayer').returns(mockUser).withArgs('Margaret').throws('NoSuchPlayer');
			sandbox.spy(mockGame, 'killPlayer');

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.called.should.be.false;
				const output = view.reportError.getCall(0).args[2];
				output.toString().should.include('Target not in game');
			});
		});

		it('Should report errors', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockGame, 'killPlayer').rejects('an error occurred');

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.called.should.be.true;
				const output = view.reportError.getCall(0).args[2];
				output.should.be.an('Error');
				output.toString().should.include('an error occurred');
			});
		});

		it('Should kill players', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockGame, 'killPlayer');
			const expectedOutput = {
				command: 'Kill',
				results: 'Killed @Margaret',
				game: 'testMafia'
			};

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.calledWith('Margaret').should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expectedOutput);
			});
		});

		it('Should work from chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret'
				],
				parent: {
					ids: {
						topic: -1,
						chat: 123
					}
				},
			};

			sandbox.spy(mockGame, 'killPlayer');

			return modController.killHandler(command).then(() => {
				mockGame.killPlayer.calledWith('Margaret').should.be.true;
			});
		});
	});

	describe('nextPhase()', () => {
		let mockGame, mockUser, mockdao, modController;

		beforeEach(() => {

			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};


			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => ['Rachel', 'Ross', 'Joey', 'Chandler', 'Phoebe', 'Monica'],
				livePlayers: [mockUser, mockUser, mockUser],
				killPlayer: () => Promise.resolve(),
				nextPhase: () => Promise.resolve(),
				getActions: () => 1,
				getPlayer: () => mockUser,
				getModerator: () => mockUser,
				topicId: 12,
				day: 1,
				setValue: () => Promise.resolve(),
				phase: 'night'
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});

		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			mockUser.isModerator = false;
			sandbox.spy(mockGame, 'nextPhase');
			sandbox.stub(mockGame, 'getModerator').throws();

			return modController.phaseHandler(command).then(() => {
				//Game actions
				mockGame.nextPhase.called.should.equal(false);

				//Output back to mod
				view.reportError.calledWith(command).should.be.true;
				const modOutput = view.reportError.getCall(0).args[2].toString();
				modOutput.should.include('You are not a moderator');
			});
		});

		it('Should reject non-existant game', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockdao, 'getGameByTopicId').rejects(new Error('No such game'));
			sandbox.spy(mockGame, 'nextPhase');

			return modController.phaseHandler(command).then(() => {
				//Output back to mod
				view.reportError.calledWith(command).should.be.true;
				const modOutput = view.reportError.getCall(0).args[2];
				modOutput.should.be.an('Error');
				modOutput.toString().should.include('Error: No such game');

			});
		});

		it('Should move to night', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.stub(mockGame, 'nextPhase').resolves();

			return modController.phaseHandler(command).then(() => {
				//Game actions
				mockGame.nextPhase.called.should.be.true;

				//Output to game
				view.respondInThread.calledWith(12).should.be.true;
				const modOutput = view.respondInThread.getCall(0).args[1];
				modOutput.should.include('It is now night');


				view.respondWithTemplate.called.should.not.be.true;

			});
		});

		it('Should work in chatt', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: -1,
						chat: 1234
					}
				},
			};
			sandbox.stub(mockGame, 'nextPhase').resolves();

			return modController.phaseHandler(command).then(() => {
				//Game actions
				mockGame.nextPhase.called.should.be.true;

				//Output to game
				view.respondInThread.calledWith(12).should.be.true;
				const modOutput = view.respondInThread.getCall(0).args[1];
				modOutput.should.include('It is now night');


				view.respondWithTemplateInThread.called.should.not.be.true;

			});
		});

		it('Should optionally add an end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends', 'today'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.phaseHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.true;
				mockGame.setValue.calledWith('phaseEnd', 'today').should.be.true;

				view.respondInThread.calledWith(12).should.be.true;
				const modOutput = view.respondInThread.getCall(0).args[1];
				modOutput.should.include('The phase will end today');

			});
		});

		it('Should optionally add an end time with spaces', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends', 'on', 'march', 'second'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.phaseHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.true;
				mockGame.setValue.calledWith('phaseEnd', 'on march second').should.be.true;

			});
		});

		it('Should not require an end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.phaseHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});

		it('Should handle malformed end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.phaseHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});

		it('Should ignore other args', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['banana', 'today'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.phaseHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});
	});

	describe('new-day()', () => {
		let mockGame, mockUser, mockdao, modController;

		beforeEach(() => {

			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};


			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => ['Rachel', 'Ross', 'Joey', 'Chandler', 'Phoebe', 'Monica'],
				livePlayers: [mockUser, mockUser, mockUser],
				killPlayer: () => Promise.resolve(),
				nextPhase: () => Promise.resolve(),
				newDay: () => Promise.resolve(),
				getActions: () => 1,
				getPlayer: () => mockUser,
				getModerator: () => mockUser,
				topicId: 12,
				day: 1,
				setValue: () => Promise.resolve(),
				phase: 'night'
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});

		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			mockUser.isModerator = false;
			sandbox.spy(mockGame, 'nextPhase');
			sandbox.stub(mockGame, 'getModerator').throws();

			return modController.dayHandler(command).then(() => {
				//Game actions
				mockGame.nextPhase.called.should.equal(false);

				//Output back to mod
				view.reportError.calledWith(command).should.be.true;
				const modOutput = view.reportError.getCall(0).args[2].toString();
				modOutput.should.include('You are not a moderator');
			});
		});

		it('Should reject non-existant game', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockdao, 'getGameByTopicId').rejects(new Error('No such game'));
			sandbox.spy(mockGame, 'nextPhase');

			return modController.dayHandler(command).then(() => {
				//Output back to mod
				view.reportError.calledWith(command).should.be.true;
				const modOutput = view.reportError.getCall(0).args[2];
				modOutput.should.be.an('Error');
				modOutput.toString().should.include('Error: No such game');

			});
		});

		it('Should advance days', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.stub(mockGame, 'newDay', () => {
				mockGame.day++;
				return Promise.resolve();
			});

			return modController.dayHandler(command).then(() => {
				//Game actions
				mockGame.newDay.called.should.be.true;

				//Output to game
				view.respondWithTemplateInThread.called.should.be.true;
				const actualData = view.respondWithTemplateInThread.getCall(0).args[1];

				actualData.day.should.equal(mockGame.day);
				actualData.numPlayers.should.equal(3);
				actualData.toExecute.should.equal(2);
				actualData.names.should.deep.equal(['God', 'God', 'God']);

			});
		});

		it('Should work from chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: -1,
						chat: 1234
					}
				},
			};
			sandbox.stub(mockGame, 'newDay', () => {
				mockGame.day++;
				return Promise.resolve();
			});

			return modController.dayHandler(command).then(() => {
				//Game actions
				mockGame.newDay.called.should.be.true;

				//Output back to mod
				view.respondWithTemplateInThread.called.should.be.true;

			});
		});

		it('Should optionally add an end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends', 'today'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.dayHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.true;
				mockGame.setValue.calledWith('phaseEnd', 'today').should.be.true;

				view.respondInThread.calledWith(12).should.be.true;
				const modOutput = view.respondInThread.getCall(0).args[1];
				modOutput.should.include('The phase will end today');

			});
		});

		it('Should optionally add an end time with spaces', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends', 'on', 'march', 'second'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.dayHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.true;
				mockGame.setValue.calledWith('phaseEnd', 'on march second').should.be.true;

			});
		});

		it('Should not require an end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.dayHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});

		it('Should handle malformed end time', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['ends'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.dayHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});

		it('Should ignore other args', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'tehNinja'
				}),
				args: ['banana', 'today'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.spy(mockGame, 'setValue');

			return modController.dayHandler(command).then(() => {
				//Set the flag
				mockGame.setValue.called.should.be.false;
			});
		});
	});

	describe('add()', () => {
		let mockGame, mockdao, modController;

		beforeEach(() => {
			mockGame = {
				addTopic: () => Promise.resolve(),
				addChat: () => Promise.resolve(),
				getModerator: () => Promise.resolve()
			};


			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame),
				getGameByName: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});

		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'thread',
					'123',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockGame, 'getModerator').throws('E_NOMOD');

			return modController.addHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('You are not a moderator');
			});
		});

		it('Should require 3 arguments', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: ['huh?'],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByName');

			return modController.addHandler(command).then(() => {
				view.reportError.called.should.be.true;
			});
		});

		it('Should accept terse format', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'thread',
					'123',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByName');

			return modController.addHandler(command).then(() => {
				mockdao.getGameByName.calledWith('testMafia').should.be.true;
			});
		});

		it('Should accept friendly format', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'thread',
					'123',
					'to',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByName');

			return modController.addHandler(command).then(() => {
				mockdao.getGameByName.calledWith('testMafia').should.be.true;
			});
		});

		it('Should add threads', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'thread',
					'123',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addTopic.called.should.be.true;
			});
		});

		it('Should add chats', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'chat',
					'123',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockGame, 'addChat');

			return modController.addHandler(command).then(() => {
				mockGame.addChat.called.should.be.true;
			});
		});

		it('Should not add cats', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'cat',
					'123',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockGame, 'addChat');
			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addChat.called.should.be.false;
				mockGame.addTopic.called.should.be.false;

				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('I don\'t know how to add a "cat".');
			});
		});

		it('Should add "this" when requested from a thread', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'this',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				}
			};

			sandbox.spy(mockGame, 'addChat');
			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addTopic.calledWith(12345).should.be.true;
			});
		});

		it('Should add "this" when requested from a chat', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: -1
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				parent: {
					ids: {
						topic: -1,
						chat: 12
					}
				},
				args: [
					'this',
					'testMafia'
				]
			};

			sandbox.spy(mockGame, 'addChat');
			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addChat.called.should.be.true;

				mockGame.addChat.firstCall.args[0].should.equal(12);
			});
		});

		it('Should add "this" when requested from a thread (natural syntax)', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'this',
					'to',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				}
			};

			sandbox.spy(mockGame, 'addChat');
			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addTopic.calledWith(12345).should.be.true;
			});
		});

		it('Should add "this" when requested from a chat (natural syntax)', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: -1
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'this',
					'to',
					'testMafia'
				],
				parent: {
					ids: {
						topic: -1,
						chat: 12
					}
				}
			};

			sandbox.spy(mockGame, 'addChat');
			sandbox.spy(mockGame, 'addTopic');

			return modController.addHandler(command).then(() => {
				mockGame.addChat.called.should.be.true;

				mockGame.addChat.firstCall.args[0].should.equal(12);
			});
		});
	});
	describe('set()', () => {

		let mockGame, mockUser, mockTarget, mockdao, modController;

		beforeEach(() => {
			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};

			mockTarget = {
				username: 'Margaret',
				getPlayerProperty: () => [],
				isModerator: false,
				isAlive: true,
				addProperty: () => true
			};

			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => 1,
				killPlayer: () => Promise.resolve(),
				nextPhase: () => 1,
				getActions: () => 1,
				getPlayer: () => mockTarget,
				getModerator: () => mockUser,
				topicId: 12,
				day: 1
			};


			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame),
				getGameByName: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});


		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'loved'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			mockUser.isModerator = false;
			sandbox.stub(mockGame, 'getModerator').throws('E_NOMOD');


			return modController.setHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('You are not a moderator');
			});
		});

		it('Should reject non-players', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Sanderson',
					'loved'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.stub(mockGame, 'getPlayer').throws();

			return modController.setHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('Target not in game');
			});
		});

		it('Should require 2 arguments', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			return modController.setHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('Incorrect syntax');
			});
		});

		it('Should work in chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'loved'
				],
				parent: {
					ids: {
						topic: -1,
						chat: 123
					}
				},
			};


			return modController.setHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
			});
		});

		it('Should allow loved', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'loved'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};


			const expected = {
				command: 'Set property',
				results: 'Player Margaret is now loved',
				game: 'testMafia'
			};

			return modController.setHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});

		it('Should allow hated', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'hated'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			const expected = {
				command: 'Set property',
				results: 'Player Margaret is now hated',
				game: 'testMafia'
			};

			return modController.setHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});

		it('Should allow doublevoter', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'doublevoter'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			const expected = {
				command: 'Set property',
				results: 'Player Margaret is now doublevoter',
				game: 'testMafia'
			};

			return modController.setHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});

		it('Should allow lynchproof', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'lynchproof'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			const expected = {
				command: 'Set property',
				results: 'Player Margaret is now lynchproof',
				game: 'testMafia'
			};

			return modController.setHandler(command).then(() => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});

		it('Should allow night action properties', () => {
			const properties = ['scum', 'scum2', 'cultLeader', 'cultist', 'cop', 'wanderer'];
			let command;
			const tests = [];
			for (let i = 0; i < properties.length; i++) {
				command = {
					getTopic: () => Promise.resolve({
						id: 12345
					}),
					getUser: () => Promise.resolve({
						username: 'God'
					}),
					args: [
						'Margaret',
						properties[i]
					],
					parent: {
						ids: {
							topic: 12345
						}
					},
				};

				tests[i] = modController.setHandler(command);
			}

			return Promise.all(tests).then(() => {
				view.respondWithTemplate.called.should.be.true;
				view.respondWithTemplate.callCount.should.equal(properties.length);
				for (let i = 0; i < properties.length; i++) {
					view.respondWithTemplate.calledWith('modSuccess.handlebars', {
						command: 'Set property',
						results: 'Player Margaret is now ' + properties[i],
						game: 'testMafia'
					}).should.be.true;
				}
			});
		});

		it('Should reject doodoohead', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'doodoohead'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			return modController.setHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];

				output.should.include('Property not valid');
				output.should.include('Valid properties: loved, hated, doublevote');
			});
		});

		it('Should bubble up errors', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'doublevoter'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};
			sandbox.stub(mockTarget, 'addProperty').throws('An error occurred');


			return modController.setHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];
				output.should.be.an('Error');

				output.toString().should.include('An error occurred');
			});
		});

		it('Should read "in" command with numeric arg', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'hated',
					'in',
					'527'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByTopicId');

			return modController.setHandler(command).then(() => {
				mockdao.getGameByTopicId.calledWith('527').should.be.true;
			});
		});

		it('Should read "in" command with string arg', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'hated',
					'in',
					'Bushido',
					'Mafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByName');
			sandbox.spy(mockdao, 'getGameByTopicId');

			return modController.setHandler(command).then(() => {
				mockdao.getGameByName.calledWith('Bushido Mafia').should.be.true;
				mockdao.getGameByTopicId.called.should.be.false;
			});
		});

		it('Should not confuse string and numeric args', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'Margaret',
					'hated',
					'in',
					'21_Jump',
					'Street'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByName');
			sandbox.spy(mockdao, 'getGameByTopicId');

			return modController.setHandler(command).then(() => {
				mockdao.getGameByName.calledWith('21_Jump Street').should.be.true;
				mockdao.getGameByTopicId.called.should.be.false;
			});
		});
	}); //end of Set

	describe('listNightActions()', () => {

		let mockGame, mockUserList, mockUser, mockdao, modController;

		beforeEach(() => {
			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};

			mockUserList = {};

			mockUserList.god = mockUser;

			mockUserList.margaret = {
				username: 'Margaret',
				getPlayerProperty: () => [],
				isModerator: false,
				isAlive: true,
				addProperty: () => true
			};

			mockUserList.alex = {
				username: 'Margaret',
				getPlayerProperty: () => [],
				isModerator: false,
				isAlive: true,
				addProperty: () => true
			};

			mockUserList.steve = {
				username: 'Margaret',
				getPlayerProperty: () => [],
				isModerator: false,
				isAlive: true,
				addProperty: () => true
			};

			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => 1,
				killPlayer: () => Promise.resolve(),
				nextPhase: () => 1,
				getActions: () => 1,
				getPlayer: (p) => mockUserList[p.toLowerCase()],
				getModerator: () => mockUser,
				topicId: 12,
				day: 1
			};


			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame),
				getGameByChatId: () => Promise.resolve(mockGame),
				getGameByName: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});

		it('Should reject non-mods', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'123'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			mockUser.isModerator = false;
			sandbox.stub(mockGame, 'getModerator').throws('E_MODERATOR_NOT_EXIST');


			return modController.listNAHandler(command).then(() => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2].toString();

				output.should.include('You are not a moderator');
			});
		});

		it('Should search for the game by ID', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'in',
					'123'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByName');
			return modController.listNAHandler(command).then(() => {
				mockdao.getGameByName.called.should.be.false;
				mockdao.getGameByTopicId.called.should.be.true;
				mockdao.getGameByTopicId.calledWith('123').should.be.true;
			});
		});

		it('Should search for the game by name', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'in',
					'testMafia'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			sandbox.spy(mockdao, 'getGameByTopicId');
			sandbox.spy(mockdao, 'getGameByName');
			return modController.listNAHandler(command).then(() => {
				mockdao.getGameByName.called.should.be.true;
				mockdao.getGameByTopicId.called.should.be.false;
				mockdao.getGameByName.calledWith('testMafia').should.be.true;
			});
		});

		it('Should fetch the list of actions', () => {
			const command = {
				getTopic: () => Promise.resolve({
					id: 12345
				}),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'in',
					'123'
				],
				parent: {
					ids: {
						topic: 12345
					}
				},
			};

			const mockAction = {
				id: 1,
				actor: mockUserList.margaret,
				target: mockUserList.alex,
				type: 'target',
				token: 'scum',
				isCurrent: true
			};

			sandbox.stub(mockGame, 'getActions').returns([mockAction]);

			return modController.listNAHandler(command).then(() => {
				mockGame.getActions.calledWith('target').should.be.true;
				view.respondWithTemplate.called.should.be.true;

				const dataReceived = view.respondWithTemplate.firstCall.args[1];
				dataReceived.scum.show.should.be.true;
				dataReceived.scum.actions.should.include(mockAction);
				dataReceived.scum.actions.length.should.equal(1);
			});
		});

		it('Should work in chat', () => {
			const command = {
				getTopic: () => Promise.reject('Do not call me! you will break chat functionality'),
				getUser: () => Promise.resolve({
					username: 'God'
				}),
				args: [
					'in',
					'123'
				],
				parent: {
					ids: {
						topic: -1,
						chat: 12
					}
				},
			};

			const mockAction = {
				id: 1,
				actor: mockUserList.margaret,
				target: mockUserList.alex,
				type: 'target',
				token: 'scum',
				isCurrent: true
			};

			sandbox.stub(mockGame, 'getActions').returns([mockAction]);

			return modController.listNAHandler(command).then(() => {
				mockGame.getActions.calledWith('target').should.be.true;
				view.respondWithTemplate.called.should.be.true;
			});
		});

	});

	describe('setOption()', () => {
		let controller = null,
			dao = null,
			game = null,
			command = null;
		beforeEach(() => {
			command = {
				args: ['key', 'equal', 'value', 'in', 'game'],
				getUser: sinon.stub().resolves({}),
				reply: sinon.stub().resolves(),
				parent: {
					ids: {}
				}
			};
			game = {
				getModerator: sinon.stub(),
				setValue: sinon.stub().resolves()
			};
			dao = {
				getGame: sinon.stub().resolves(game)
			};
			controller = new ModController(dao);
		});
		describe('errors', () => {
			it('should respond with error if Command.getUser() rejects', () => {
				const error = new Error(`oopise ${Math.random()}`);
				command.getUser.rejects(error);
				return controller.setOption(command).then(() => {
					command.reply.should.be.calledWith(`Error setting player property: ${error}`);
					game.setValue.should.not.be.called;
				});
			});
			it('should respond with error if getGame() rejects', () => {
				const error = new Error(`oopise ${Math.random()}`);
				dao.getGame.rejects(error);
				return controller.setOption(command).then(() => {
					command.reply.should.be.calledWith(`Error setting player property: ${error}`);
					game.setValue.should.not.be.called;
				});
			});
			it('should respond with error if setValue() rejects', () => {
				const error = new Error(`oopise ${Math.random()}`);
				game.setValue.rejects(error);
				return controller.setOption(command).then(() => {
					command.reply.should.be.calledWith(`Error setting player property: ${error}`);
				});
			});
			it('should echo usage when no args', () => {
				command.args = [];
				return controller.setOption(command).then(() => {
					command.reply.firstCall.args[0].should.startWith('Incorrect syntax. Usage:');
					dao.getGame.should.not.be.called;
				});
			});
			it('should echo usage when no optionName given', () => {
				command.args = ['equal', 'value', 'in', 'testMafia'];
				return controller.setOption(command).then(() => {
					command.reply.firstCall.args[0].should.startWith('Incorrect syntax. Usage:');
					dao.getGame.should.not.be.called;
				});
			});
			it('should echo usage when no value given', () => {
				command.args = ['option', 'equal', 'in', 'testMafia'];
				return controller.setOption(command).then(() => {
					command.reply.firstCall.args[0].should.startWith('Incorrect syntax. Usage:');
					dao.getGame.should.not.be.called;
				});
			});
			it('should echo usage when no gameName given', () => {
				command.args = ['option', 'equal', 'foo', 'in'];
				return controller.setOption(command).then(() => {
					command.reply.firstCall.args[0].should.startWith('Incorrect syntax. Usage:');
					dao.getGame.should.not.be.called;
				});
			});
			it('should respond with error when getModerator throws', () => {
				const error = new Error(`oopise ${Math.random()}`);
				game.getModerator.throws(error);
				return controller.setOption(command).then(() => {
					command.reply.should.be.calledWith('Error setting player property: Error: You are not a moderator!');
					game.setValue.should.not.be.called;
				});
			});
		});
		it('should get gameName via arguments', () => {
			const expected = `game${Math.random()}`;
			command.args = ['option', 'equal', 'foo', 'in', expected];
			return controller.setOption(command).then(() => {
				dao.getGame.should.be.calledWith(expected).once;
			});
		});
		it('should get gameName via ids when not specified in arguments', () => {
			const expected = `game${Math.random()}`;
			command.parent.ids.topic = expected;
			command.args = ['option', 'equal', 'foo'];
			return controller.setOption(command).then(() => {
				dao.getGame.should.be.calledWith(expected).once;
			});
		});
		it('should check user is moderator', () => {
			const expected = `user${Math.random()}`;
			command.getUser.resolves({
				username: expected
			});
			command.args = ['option', 'equal', 'foo', 'in', 'testMafia'];
			return controller.setOption(command).then(() => {
				game.getModerator.should.be.calledWith(expected).once;
			});
		});
		it('should set value on game', () => {
			const option = `option${Math.random()}`,
				value = `value${Math.random()}`;
			command.args = [option, 'equal', value, 'in', 'testMafia'];
			return controller.setOption(command).then(() => {
				game.setValue.should.be.calledWith(option, value).once;
			});
		});
		it('should ignore optional leading `set` keyword', () => {
			const option = `option${Math.random()}`,
				value = `value${Math.random()}`;
			command.args = ['set', option, 'equal', value, 'in', 'testMafia'];
			return controller.setOption(command).then(() => {
				game.setValue.should.be.calledWith(option, value).once;
			});
		});
	});

	describe('sendRoleCard()', () => {
		let controller = null,
			dao = null,
			game = null,
			command = null,
			chatroom = null;
		beforeEach(() => {
			chatroom = {
				id: Math.random()
			};
			command = {
				args: ['userfoo', 'in', 'testMafia'],
				getUser: sinon.stub().resolves({}),
				reply: sinon.stub().resolves(),
				parent: {
					ids: {}
				},
				text: `I am a merry rolecard text\n\n${Math.random()}`
			};
			game = {
				name: 'testMafia',
				moderators: [],
				addChat: sinon.stub().resolves(),
				getModerator: sinon.stub(),
				getPlayer: sinon.stub().returns({}),
				getValue: sinon.stub().returns('')
			};
			dao = {
				getGame: sinon.stub().resolves(game)
			};
			controller = new ModController(dao);
			controller.forum = {
				Chat: {
					create: sinon.stub().resolves(chatroom)
				},
				User: {
					getByName: sinon.stub().resolves({})
				}
			};
		});
		describe('errors', () => {
			it('should reply with usage when no args provided', () => {
				command.args = [];
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith('Invalid command: Usage `!send-rolecard TargetUsername in TargetGame`').once;
				});
			});
			it('should reply with usage when username not provided', () => {
				command.args.shift();
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith('Invalid command: Usage `!send-rolecard TargetUsername in TargetGame`').once;
				});
			});
			it('should reply with usage when gameName not provided', () => {
				command.args.pop();
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith('Invalid command: Usage `!send-rolecard TargetUsername in TargetGame`').once;
				});
			});
			it('should reply with error when getGame rejects', () => {
				const error = new Error(`whoopsies ${Math.random()}`),
					errormsg = `Error sending rolecard: ${error}`;
				dao.getGame.rejects(error);
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply with error when getUser() rejects', () => {
				const error = new Error(`whoopsies ${Math.random()}`),
					errormsg = `Error sending rolecard: ${error}`;
				command.getUser.rejects(error);
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply with error when mod not found', () => {
				const errormsg = 'Error sending rolecard: Error: You are not a moderator for testMafia';
				game.getModerator.throws(new Error());
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
			it('should reply with error when user not found', () => {
				const errormsg = 'Error sending rolecard: Error: userfoo is not a living player in testMafia';
				game.getPlayer.throws(new Error());
				return controller.sendRoleCard(command).then(() => {
					command.reply.should.be.calledWith(errormsg).once;
				});
			});
		});
		it('should create chatroom on success', () => {
			return controller.sendRoleCard(command).then(() => {
				controller.forum.Chat.create.should.be.called.once;
			});
		});
		it('should retrieve mods for user list', () => {
			const mod1 = `mod${Math.random()}`,
				mod2 = `mod${Math.random()}`;
			game.moderators = [{
				username: mod1
			}, {
				username: mod2
			}];
			return controller.sendRoleCard(command).then(() => {
				controller.forum.User.getByName.calledWith(mod1).should.equal(true);
				controller.forum.User.getByName.calledWith(mod2).should.equal(true);
			});
		});
		it('should retrieve target for user list', () => {
			const target = `user${Math.random()}`;
			game.getPlayer.returns({
				username: target
			});
			return controller.sendRoleCard(command).then(() => {
				controller.forum.User.getByName.calledWith(target).should.equal(true);
			});
		});
		it('should pass user objects to create', () => {
			const mod1 = {
					id: Math.random()
				},
				mod2 = {
					id: Math.random()
				},
				target = {
					id: Math.random()
				};
			game.moderators = [{
				username: `mod${Math.random()}`
			}, {
				username: `mod${Math.random()}`
			}];
			controller.forum.User.getByName.onFirstCall().resolves(mod1);
			controller.forum.User.getByName.onSecondCall().resolves(mod2);
			controller.forum.User.getByName.onThirdCall().resolves(target);
			return controller.sendRoleCard(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[0].should.include(mod1);
				args[0].should.include(mod2);
				args[0].should.include(target);
			});
		});

		it('should set chat name as expected', () => {
			const name = `mafia game ${Math.random()}`;
			game.name = name;
			return controller.sendRoleCard(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[2].should.equal(`Rolecard for ${name}`);
			});
		});
		it('should send text of the command parent as rolecard', () => {
			const text = `text \ntext\n text\n ${Math.random()}`;
			command.parent.text = text;
			return controller.sendRoleCard(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[1].should.equal(text);
			});
		});
		it('should send text of the command parent as rolecard', () => {
			const text = `text \ntext\n text\n ${Math.random()}`;
			command.parent.text = text;
			return controller.sendRoleCard(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[1].should.equal(text);
			});
		});
		it('should strip commands from rolecard for bastard game', () => {
			const text = 'text1\ntext2\ntext3';
			game.getValue.returns('true');
			command.parent.text = 'text1\n!set player hated\ntext2\n!send-rolecard player\ntext3';
			return controller.sendRoleCard(command).then(() => {
				const args = controller.forum.Chat.create.firstCall.args;
				args[1].should.equal(text);
			});
		});
	});
});
