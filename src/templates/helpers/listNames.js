'use strict';
const Handlebars = require('handlebars');

module.exports = function(formatter) {

	return function(list) {
		list = list.map((value) => {
			if (typeof value === 'object') {
				if (value.isCurrent) {
					return formatter.link(formatter.urlForPost(value.postId), formatter.bold(value.actor.username));
				} else {
					return formatter.link(formatter.urlForPost(value.postId), `<s>${value.actor.username}</s>`) + ' ' +
						formatter.link(formatter.urlForPost(value.revokedId), '[X]');
				}

			}
			return value;
		});
		return new Handlebars.SafeString(list.join(', '));
	};
};
