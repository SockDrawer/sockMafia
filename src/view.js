'use strict';
const readFile = require('fs-readfile-promise');
const Handlebars = require('handlebars');

let browser = {
	createPost: () => 0
};

exports.setBrowser = function(newBrowser) {
	browser = newBrowser;
};

exports.respond = function(command, output) {
	browser.createPost(
		command.post.topic_id,
		command.post.post_number,
		output,
		() => 0
	);
};

exports.respondWithTemplate  = function(templateFile, data, command) {
	return readFile(__dirname + '/' + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		browser.createPost(command.post.topic_id, command.post.post_number, output, () => 0);
	});
};

exports.reportError = function(command, preface, error) {
	browser.createPost(
		command.post.topic_id,
		command.post.post_number,
		'' + preface + error,
		() => 0
	);
};
