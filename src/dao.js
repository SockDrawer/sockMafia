/**
 * Heavily borrowed from https://github.com/SockDrawer/SockRPG
 */
'use strict';
const orm = require('sequelize');
const Models = {};

let initialised = false;
let db;

function checkConfig(config) {
    if (!config) {
        throw new Error('Configuration information must be supplied.');
    }

    if (!config.db) {
        throw new Error('Database location must be defined.');
    }

    if (typeof config.db !== 'string') {
        throw new Error('Database location must be a string.');
    }
};

function createModel(config) {
	//Database
	db = new orm('mafiabot', null, null, {
			host: 'localhost',
			dialect: 'sqlite',
			logging: undefined,
			storage: config.db,
			timestamps: true,
			paranoid: true
		});
		
    // Tables
    const player = require('./models/player')(db);
    const game = require('./models/game')(db);
    const segment = require('./models/segment')(db);
    const roster = require('./models/roster')(db);
    const vote = require('./models/vote')(db);
	

    // Relations
    // |- 1:1
    //segment.hasOne(game);
    // |- 1:N
    player.hasMany(vote, {as: 'voter'});
    player.hasMany(vote, {as: 'target'});
    game.hasMany(vote);
   // game.hasMany(segment);
    // |- M:N
    player.belongsToMany(game, {through: roster});
    game.belongsToMany(player, {through: roster});
	roster.belongsTo(game);


    // model handles
    Models.players = player;
    Models.games = game;
    Models.segments = segment;
    Models.roster = roster;
    Models.votes = vote;
	
	initialised = true;
}

/*eslint-disable no-console*/
function initialise(config) {
	return new Promise((resolve) => {
		console.log('Mafia: Checking configuration');
		checkConfig(config);
		console.log('Mafia: Configuration valid');
		resolve();
	}).then(() => {
		console.log('Mafia: Creating database');
		createModel(config);
		console.log('Mafia: Database created');
	}).then(() => {
		console.log('Mafia: Synching database');
		db.sync({force: true});
	}).then( () => {
		console.log('Mafia: Sync complete. Your database is ready to go.');
	}).catch((err) => {
		console.err('Mafia: ' + err);
		throw err;
	});
};
/*eslint-enable no-console*/

module.exports = {
	createDB: function(config) {
		if (!initialised) {
			return initialise(config);
		} else {
			return Promise.resolve();
		}
	},
	
	ensureGameExists: function(id) {
		return Models.games.findOrCreate({where: {id: '' + id}, defaults: {status: 'prep', currentDay: 0, stage: 'night'}});
	},
	
	isPlayerInGame: function(game, player) {
		db.query('SELECT gameId FROM `rosters` INNER JOIN players ON players.id = rosters.playerId WHERE players.name="' + player + '" and gameId=' + game, { type: db.QueryTypes.SELECT})
		  .then(function(rows) {
			return rows.length > 0;
		  })
		/*return Models.roster.findOne({where: {playerId: player, gameID: game}}).then((playerInstance) => {
			return playerInstance !== null;
		});*/
	},
	
	addPlayerToGame: function(game, player) {
		let insPlayer;
		return Models.players.findOrCreate({where: {name: '' + player}}).then((playerInstance) => {
			insPlayer = playerInstance[0];
			return db.query('INSERT INTO rosters (playerId,gameId) VALUES ($playerId, $gameId)', { type: db.QueryTypes.INSERT, bind: { 'playerId': insPlayer.id, 'gameId': game}})
		}).then(db.sync());		
	},
	
	getPlayers: function(game) {
		return Models.games.findById(game, {include: {model: Models.players, as: 'Roster'}}).then((gameInstance) => {
			return gameInstance.Roster;
		});
	}
};