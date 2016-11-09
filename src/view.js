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

let chat;

let readFile = require('fs-readfile-promise');

exports.activate = function(forum, rf) {
	debug('activating view');
	post = forum ? forum.Post : post;
	try {
		chat = forum ? forum.Chat : undefined;
	} catch (e) {
		debug('Chats not supported.');
	}
	formatter = forum ? forum.Format : formatter;
	readFile = rf || require('fs-readfile-promise');

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

exports.respondInChat = function(chatId, output) {
	if (!chat) {
		return Promise.reject('Cannot output to chat; provider does not support it.');
	}
	
	return chat.get(chatId).then((chatroom) => chatroom.send(output));
};

exports.respondInThread = function(thread, output) {
	return post.reply(thread, undefined, output);
};

exports.respondWithTemplate  = function(templateFile, data, command) {
	return readFile(__dirname + '/templates/' + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		return command.reply(output);
	});
};

exports.respondWithTemplateInThread  = function(templateFile, data, thread) {
	return readFile(__dirname + '/' + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		return post.reply(thread, undefined, output);
	});
};

exports.reportError = function(command, preface, error) {
	command.reply(preface + error);
	return Promise.resolve();
};
