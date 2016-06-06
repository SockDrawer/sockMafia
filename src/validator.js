const dao = require('./dao/index.js');
const Promise = require('bluebird');

function mustBeTrue(check, args, error) {
	return check.apply(null, args).then((result) => {
		if (result) {
			return Promise.resolve();
		} else {
			return Promise.reject(error);
		}
	});
}

function mustBeFalse(check, args, error) {
	return check.apply(null, args).then((result) => {
		if (!result) {
			return Promise.resolve();
		} else {
			return Promise.reject(error);
		}
	});
}

function isDaytime(game) {
	return dao.getCurrentTime(game).then((time) => {
		return time === dao.gameTime.day;
	});
}

module.exports = {
	mustBeFalse: mustBeFalse,
	mustBeTrue: mustBeTrue,
	isDaytime: isDaytime
};
