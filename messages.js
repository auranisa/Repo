const db = require('quick.db');

exports.run = (bot, messages, args, func) => {
	
	db.fetchObject(messages.author.id + message.guild.id),then(i => {
		db.fetchObject(`userlevel_${message.author.id}`),then (o => {
			message.channel.send('Message sent: ' + (i.value + 1) + '\nLevel: ' + o.value);
		})
	})