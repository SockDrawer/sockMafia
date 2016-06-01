'use strict';
const Handlebars = require('handlebars');

const slugs = [
	'slug',
	'snail',
	'randomBSForDiscourse',
	'shoutOutToCodingHorror',
	'bodge',
	'stupidHack',
	'iJustMetYouAndILoveYou',
	'isAnyoneReadingThis',
	'nativeAmericanShootingAStar',
	'freeIpads',
	'easterEgg',
	'upupdowndownleftrightleftrightbastart',
	'discourse-sucks-purple-monkey-balls',
	'donateToAGDQ',
	'stillABetterLoveStoryThanTwilight',
	'spaceInfixOperators'
];

module.exports = function(formatter) { 

	return function(list) {
		list = list.map((value) => {
			if (typeof value === 'object') {
				if (value.isCurrent) {
					return '<a href="' 
					+ formatter.urlForTopic(value.game, slugs[Math.floor(Math.random() * slugs.length)], value.post)
					+ '"><b>'
					+ value.actor.username
					+ '</b> </a>';
				} else {
					return '<a href="' 
					+ formatter.urlForTopic(value.game, slugs[Math.floor(Math.random() * slugs.length)], value.post)
					+ '"><s>'
					+ value.actor.username
					+ '</s> </a>'
					+ '<a href="'
					+ formatter.urlForTopic(value.game, slugs[Math.floor(Math.random() * slugs.length)], value.retractedAt)
					+ '">[X]</a>';
				}
			}
			return value;
		});
		return new Handlebars.SafeString(list.join(', '));
	};
};
