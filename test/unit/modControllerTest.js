'use strict';
/*globals describe, it*/

const chai = require('chai'),
	sinon = require('sinon');
	
//promise library plugins
require('sinon-as-promised');
require('chai-as-promised');

chai.should();

const mafia = require('../../src/mod_controller');
const ModController = require('../../src/mod_controller');
const mafiaDAO = require('../../src/dao');
const Handlebars = require('handlebars');
const view = require('../../src/view.js');


describe('mod controller', () => {

	let sandbox;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();

		sandbox.stub(view, 'respond').resolves();
		sandbox.stub(view, 'respondInThread').resolves();
		sandbox.stub(view, 'respondWithTemplate').resolves();
		sandbox.stub(view, 'reportError').resolves();

	});
	afterEach(() => {
		sandbox.restore();
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
				getPlayer: (player) => {
					if (player === 'God') { 
						return mockUser; 
					}

					if (player === 'Margaret') { 
						return mockTarget; 
					}
					throw new Error('No such player: ' + player);
				},
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
				getGameByTopicId: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});


		it('Should reject non-mods', () => {
			const command = {
				post: {
					username: 'God',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'Margaret'
				]
			};

			mockUser.isModerator = false;
			
			return modController.killHandler(command).then( () => {
				const output = view.reportError.getCall(0).args[2];
				output.should.include('You are not a moderator');
			});
		});
		
		it('Should not kill dead players', () => {
			const command = {
				post: {
					username: 'God',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'Margaret'
				]
			};

			mockTarget.isAlive = false;
			sandbox.spy(mockGame, 'killPlayer');

			return modController.killHandler(command).then( () => {
				mockGame.killPlayer.called.should.be.false;
				const output = view.reportError.getCall(0).args[2];
				output.should.include('Target not alive');
			});
		});
		
		it('Should not kill players not in the game', () => {
			const command = {
				post: {
					username: 'God',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'Margaret'
				]
			};

			sandbox.stub(mockGame, 'getPlayer').returns(mockUser).withArgs('Margaret').throws('NoSuchPlayer');
			sandbox.spy(mockGame, 'killPlayer');
			
			return modController.killHandler(command).then( () => {
				mockGame.killPlayer.called.should.be.false;
				const output = view.reportError.getCall(0).args[2];
				output.toString().should.include('Target not in game');
			});
		});
		
		it('Should report errors', () => {
			const command = {
				post: {
					username: 'God',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'Margaret'
				]
			};

			sandbox.stub(mockGame, 'killPlayer').rejects('an error occurred');

			return modController.killHandler(command).then( () => {
				mockGame.killPlayer.called.should.be.true;
				const output = view.reportError.getCall(0).args[2];
				output.should.be.an('Error');
				output.toString().should.include('an error occurred');
			});
		});
		
		it('Should kill players', () => {
			const command = {
				post: {
					username: 'God',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'Margaret'
				]
			};

			sandbox.spy(mockGame, 'killPlayer');
			const expectedOutput = {
				command: 'Kill',
				results: 'Killed @Margaret',
				game: 'testMafia'
			} ;
			
			return modController.killHandler(command).then( () => {
				mockGame.killPlayer.calledWith('Margaret').should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expectedOutput);
			});
		});
	});
	
	describe('new-day()', () => {
		let mockGame, mockUser, mockdao, modController;

		beforeEach(() => {
			mockGame = {
				isActive: true,
				name: 'testMafia',
				getAllPlayers: () => 1,
				killPlayer: () => Promise.resolve(),
				nextPhase: () => 1,
				getActions: () => 1,
				getPlayer: () => mockUser,
				topicId: 12,
				day: 1
			};

			mockUser = {
				username: 'God',
				getPlayerProperty: () => [],
				isModerator: true
			};

			mockdao = {
				getGameByTopicId: () => Promise.resolve(mockGame)
			};

			modController = new ModController(mockdao);
		});

		it('Should reject non-mods', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			mockUser.isModerator = false;
			sandbox.spy(mockGame, 'nextPhase');

			return modController.dayHandler(command).then( () => {
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
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};

			sandbox.stub(mockdao, 'getGameByTopicId').rejects('No such game');
			sandbox.spy(mockGame, 'nextPhase');
			
			return modController.dayHandler(command).then( () => {			
				//Output back to mod
				view.reportError.calledWith(command).should.be.true;
				const modOutput = view.reportError.getCall(0).args[2];
				modOutput.should.be.an('Error');
				modOutput.toString().should.include('Error: No such game');

			});
		});

		it('Should move to night', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				}
			};
			sandbox.spy(mockGame, 'nextPhase');

			return modController.dayHandler(command).then( () => {
				//Game actions
				mockGame.nextPhase.called.should.be.true;
				
				//Output back to mod
				view.respond.calledWith(command).should.be.true;
				const modOutput = view.respond.getCall(0).args[1];
				modOutput.should.include('Incremented stage for testMafia');
				
				//Output to game
				view.respondWithTemplate.called.should.not.be.true;

			});
		});
	});
/*	
	describe('set()', () => {
		it('Should reject non-mods', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'loved'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(false);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			return mafia.setHandler(command).then( () => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];

				output.should.include('Poster is not mod');
			});
		});

		it('Should reject non-players', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'loved'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(false);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			return mafia.setHandler(command).then( () => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];

				output.should.include('Target not valid');
			});
		});
		
		it('Should allow loved', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'loved'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};

			const expected = {
				command: 'Set property',
				results: 'Player yamikuronue is now loved',
				game: 12345
			};
			
			return mafia.setHandler(command).then( () => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});
		
		it('Should allow hated', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'hated'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			const expected = {
				command: 'Set property',
				results: 'Player yamikuronue is now hated',
				game: 12345
			};
			
			return mafia.setHandler(command).then( () => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});
		
		it('Should allow doublevoter', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'doublevoter'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			const expected = {
				command: 'Set property',
				results: 'Player yamikuronue is now doublevoter',
				game: 12345
			};
			
			return mafia.setHandler(command).then( () => {
				view.respondWithTemplate.called.should.be.true;
				const output = view.respondWithTemplate.getCall(0).args[1];
				output.should.deep.equal(expected);
			});
		});
		
		it('Should reject doodoohead', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'doodoohead'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').resolves();
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			return mafia.setHandler(command).then( () => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];

				output.should.include('Property not valid');
				output.should.include('Valid properties: loved, hated, doublevote');
			});
		});
		
		it('Should report errors from the DAO', () => {
			const command = {
				post: {
					username: 'tehNinja',
					'topic_id': 12345,
					'post_number': 98765
				},
				args: [
					'yamikuronue',
					'doublevoter'
				]
			};

			sandbox.stub(mafiaDAO, 'getGameStatus').resolves(mafiaDAO.gameStatus.running);
			sandbox.stub(mafiaDAO, 'isPlayerMod').resolves(true);
			sandbox.stub(mafiaDAO, 'isPlayerInGame').resolves(true);
			sandbox.stub(mafiaDAO, 'addPropertyToPlayer').rejects('Error in DAO');
			
			mafia.internals.configuration = {
				mods: ['dreikin'],
				name: 'testMafia'
			};
			
			return mafia.setHandler(command).then( () => {
				view.reportError.calledWith(command).should.be.true;
				const output = view.reportError.getCall(0).args[2];
				output.should.be.an('Error');

				output.toString().should.include('Error in DAO');
			});
		});
	});
	*/
});
