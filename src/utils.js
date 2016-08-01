'use strict';

/* Native extension utilities */
/*eslint-disable no-extend-native*/
Array.prototype.contains = function (element) {
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/


module.exports = {
	Enums: {
		validProperties: [
			'loved',
			'hated',
			'doublevoter',
			'lynchproof',
			'scum',
			'scum2',
			'cultleader',
			'cultist',
			'cop',
			'wanderer'
		]
	},

	argParse: (args, endTokens) => {
		let token = args.shift();
		const value = [],
			tokenCheck = (tok) => tok === token.toLowerCase();

		while (token && !endTokens.some(tokenCheck)) {
			value.push(token);
			token = args.shift();
		}
		return value.join(' ');
	},
	isEnabled(value) {
		value = (value || '').toLowerCase();
		return ['true', 'enabled', 'ok', 'yes'].some((val) => val === value);
	},

	/**
	* Get the number of votes required to lynch a player
	*
	* Game rules:
	* - A single player must obtain a simple majority of votes in order to be lynched
	* - Loved and Hated players are exceptions to this rule.
	*
	* @param   {sockmafia.src.dao.MafiaGame} game   The game in which the votes are being tabulated
	* @param   {sockmafia.src.dao.MafiaUser} target The target's name
	* @returns {number}        The number needed to lynch
	*/
	getNumVotesRequired: function(game, target) {
		const numPlayers = game.livePlayers.length;
		let numToLynch = Math.ceil((numPlayers + 1) / 2);

		if (target) {
			numToLynch += module.exports.getVoteModifierForTarget(game, target);
		}

		return numToLynch;
	},

		/**
	* Get the vote modifier for a given target.
	*
	* Game rules:
	* - A loved player requires one extra vote to lynch
	* - A hated player requires one fewer vote to lynch
	* @param   {sockmafia.src.dao.MafiaGame} game   The game in which the votes are being tabulated
	* @param   {sockmafia.src.dao.MafiaUser} target The user to tabulate for
	* @returns {Number}        A modifier. +1 means that the user is loved, -1 means they are hated
	*/
	getVoteModifierForTarget: function(game, target) {
		if (!target) {
			return 0;
		}

		if (target.hasProperty('loved')) {
			return 1;
		}
		if (target.hasProperty('hated')) {
			return -1;
		}
		return 0;
	}
};
