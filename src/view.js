'use strict';
const Handlebars = require('handlebars');
Handlebars.registerHelper('voteChart', require('./templates/helpers/voteChart'));
Handlebars.registerHelper('listNames', require('./templates/helpers/listNames'));

let post = {
	reply: () => {
		return Promise.resolve();
	}
};


let readFile = require('fs-readfile-promise');

exports.init = function(postObject, rf) {
	//TODO:
	//This currently always replies in a static way
	//because by the time the controller is done, we've lost Post context.
	//When the controller is updated, it should reply using the Post passed in the Command
	
	post = postObject;
	readFile = rf || require('fs-readfile-promise');
};

exports.respond = function(command, output) {
	return post.reply(command.post.topic_id, command.post.post_number, output);
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
		return post.reply(command.post.topic_id, command.post.post_number, output);
	});
};

exports.reportError = function(command, preface, error) {
	return post.reply(command.post.topic_id, command.post.post_number, preface + error);
};