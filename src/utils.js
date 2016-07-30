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
	}
};
