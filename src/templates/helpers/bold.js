'use strict';
module.exports = function(formatter) {
	return function(options) {
        return formatter.bold(options.fn(this));
    };
};
