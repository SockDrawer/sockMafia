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
	},
	bold: (text) => text,
	header: (text) => text,
	subheader: (text) => text,
	link: (url, text) => `${text} (${url})`
	
};

let chat;
let templateDir = '/templates/multiline/markdown/'; //Sensible default
let splitLines = false;

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
	
	//Which templates to use
	if (forum.supports) {
		if (forum.supports('Formatting.Multiline')) {
			splitLines = false;
			//Until we have lists in formatter, use separate templates
			if (forum.supports('Formatting.Markup.HTML')) {
				templateDir = '/templates/multiline/html/';
			} else {
				templateDir = '/templates/multiline/markdown/';
			}
		} else {
			templateDir = '/templates/singleline/';
			splitLines = true;
		}
	}

	//Template helpers
	Handlebars.unregisterHelper('voteChart');
	Handlebars.unregisterHelper('listNames');
	Handlebars.registerHelper('voteChart', require('./templates/helpers/voteChart')(formatter));
	Handlebars.registerHelper('listNames', require('./templates/helpers/listNames')(formatter));
	Handlebars.registerHelper('header', require('./templates/helpers/header')(formatter));
	Handlebars.registerHelper('subheader', require('./templates/helpers/subheader')(formatter));
	Handlebars.registerHelper('bold', require('./templates/helpers/bold')(formatter));
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
	return readFile(__dirname + templateDir + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		if (splitLines) {
			return command.getPost().then((p) => Promise.all(
				output.split('\n').map((line) => p.reply(line))
			));
		} else {
			return command.reply(output);
		}
	});
};

exports.respondWithTemplateInThread  = function(templateFile, data, thread) {
	return readFile(__dirname + templateDir + templateFile)
	.then((buffer) => {
		const source = buffer.toString();
		const template = Handlebars.compile(source);

		const output = template(data);
		if (splitLines) {
			return Promise.all(
				output.split('\n').map((line) => post.reply(line))
				);
		} else {
			return post.reply(output);
		}
	});
};

exports.reportError = function(command, preface, error) {
	command.reply(preface + error);
	return Promise.resolve();
};
