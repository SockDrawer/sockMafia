'use strict';
const debug = require('debug')('sockbot:mafia:view');

const Handlebars = require('handlebars');

let post = {
	reply: () => {
		return Promise.resolve();
	}
};

let formatter = {
	urlForPost: () => {
		return '';
	},
	urlForTopic: () => {
		return '';
	},
	quotePost: (text) => {
		return text;
	}
};

let readFile = require('fs-readfile-promise');

exports.init = function(postObject, forum, rf) {
	//TODO:
	//This currently always replies in a static way
	//because by the time the controller is done, we've lost Post context.
	//When the controller is updated, it should reply using the Post passed in the Command
	
	// Actually, just use the `reply()` function on the new commandobject. pass it your content and
	// sockbot takes care of the rest.
	debug('init of mafiaview');
	post = postObject;
	readFile = rf || require('fs-readfile-promise');
	formatter = forum ? forum.Format : formatter;

	//Template helpers
	Handlebars.unregisterHelper('voteChart');
	Handlebars.unregisterHelper('listNames');
	Handlebars.registerHelper('voteChart', require('./templates/helpers/voteChart')(formatter));
	Handlebars.registerHelper('listNames', require('./templates/helpers/listNames')(formatter));


};

exports.respond = function(command, output) {
	command.reply(output);
	return Promise.resolve();
};

exports.respondInThread = function(thread, output) {
	return post.reply(thread, undefined, output);
};

exports.respondWithTemplate  = function(templateFile, data, command) {
	return readFile(__dirname + '/' + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		return command.reply(output);
	});
};

exports.reportError = function(command, preface, error) {
	command.reply(preface + error);
	return Promise.resolve();
};
