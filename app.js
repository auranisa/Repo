var Discord = require('discord.js');
var bot = new Discord.Client();
var fs = require('fs');

//var userData = JSON.parse(fs.readFileSync('storage/userData.json', 'utf8'));
var commandsList = fs.readFileSync('storage/commands.txt', 'utf8');

function userInfo(user){
	var finalString = '';
	
	finalString = finalString + '**' +user.username + '** with the **ID** of **' + user.id + '**';
	finalString = finalString + ' created at ' + user.createdAt;
	return finalString;
}

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  
  bot.user.setActivity('$help');
});

bot.on('message', message => {
	var sender = message.author;
	var msg = message.content.toUpperCase();
	var prefix = '$'

	if (msg === prefix + 'HELP'){
		message.channel.send(commandsList);
	}

	if (msg === prefix + 'USERINFO'){
		message.channel.send(userInfo(sender));
	}

	if (msg === 'ASSALAMUALAIKUM' || msg === prefix + 'ASSALAMUALAIKUM'){
		message.channel.send(`Waalaikumsalam ${sender} :smiley:`);
	}
	
	if (msg === 'ASSALAMUALAIKUM' || msg === prefix + 'ASSALAMUALAIKUM'){
		message.channel.send(`Waalaikumsalam ${sender} :smiley:`);
	}
	
	if (msg === `SABAR YA ${sender}`){
		message.channel.send(`Iya aku selalu sabar :sob:`);
	}

	//if (!userData[sender.id]){
	//	userData[sender.id] = {messageSent : 0};
	//}
	
	//userData[sender.id].messageSent++;
	
	//fs.writeFile('storage/userData.json', JSON.stringify(userData), (err)) => {
	//	if(err) console.error(err);
	//}

});

bot.on('message', async message => {
	var sender = message.author;
	var msg = message.content.toUpperCase();
	var prefix = '$'
	
	if (msg === prefix + 'PING'){
		const m = await message.channel.send('Ping?');
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp} ms`);
	}
});

bot.login('NDM2MDYzNjU5ODM2NTcxNjQ5.DbiEcg._A8XkEn7bvQY3sXTGdIJcFFor5A');