'use strict';
const Handlebars = require('handlebars');

module.exports = function(formatter) {
	return (options) => new Handlebars.SafeString(formatter.bold(options.fn(this)));
};
