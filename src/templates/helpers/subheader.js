'use strict';
const Handlebars = require('handlebars');

module.exports = function(formatter) {
	return (options) => new Handlebars.SafeString(formatter.header3(options.fn(this)));
};
