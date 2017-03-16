'use strict';
const Handlebars = require('handlebars');
const mafia = require('../../mafiabot');

/*colors*/
const colors = {
	DARK_RED: '#560000',
	RED: '#AC1717',
	DARK_GREEN: '#005600',
	GREEN: '#617500',
	LIGHT_GREEN: '#B6CF3F',
	WHITE: '#FFFFFF'
};

module.exports = function() {
	return function(votes, modifier, toExecute, barStyle) {
		let fillColor, bgColor, percent;
		barStyle = (barStyle || 'bastard').toLowerCase();

		if (barStyle === 'hidden') {
			percent = votes / toExecute * 100;
		} else {
			percent = votes / (toExecute + modifier) * 100;
		}
		//Hammer color either when it would be hammer, or it's really hammer
		const hammer = (toExecute + modifier - votes  === 1) || (toExecute - votes  === 1);

		//Dead when they are dead, full stop
		const dead = toExecute + modifier - votes  <= 0;
		
		
		if (dead) {
			fillColor = colors.DARK_RED;
			bgColor = colors.RED;
		} else if (hammer) {
			//Hammer warning
			fillColor = colors.GREEN;
			bgColor = colors.LIGHT_GREEN;
		} else {
			fillColor = colors.DARK_GREEN;
			bgColor = colors.WHITE;
		}
		let xml = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="12">';
		xml += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
		xml += `<rect x="${(100.0 - percent)}%" width="${percent}" height="100%" fill="${fillColor}"/>`;
		if (barStyle === 'open') {
			xml += `<text x="${(100.0 - percent)}%" font-size="10" y="60%" fill="${bgColor}">${votes}/${toExecute + modifier}</text>`;
		}
		xml += '</svg>';
		
		const b64 = new Buffer(xml).toString('base64');
		const html = '<img src="data:image/svg+xml;base64,' + b64 + '">';
		return new Handlebars.SafeString(html);
	};
};
