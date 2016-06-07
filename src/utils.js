'use strict';

/* Native extension utilities */
/*eslint-disable no-extend-native*/
Array.prototype.contains = function (element) {
	return this.indexOf(element) > -1;
};
/*eslint-enable no-extend-native*/


module.exports = {
	Enums: {
		validProperties:  [
			'loved',
			'hated',
			'doublevoter',
			'lynchproof'
		]
	}
};
