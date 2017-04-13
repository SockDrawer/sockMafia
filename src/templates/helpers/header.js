'use strict';
module.exports = function(formatter) {
	return function(options) {
        return formatter.header2(options.fn(this));
    };
};
