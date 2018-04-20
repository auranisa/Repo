const express = require('express')
const path = require('path')
const PORT =  process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const sql = require('sqlite');
sql.open("./score.sqlite");

const SteamAPI = require('steamapi');
const steam = new SteamAPI('293E26DFE73707CDB6CE6F92FC55DACC');

var commandsList = fs.readFileSync('storage/commands.txt', 'utf8');
var userData = JSON.parse(fs.readFileSync('storage/userData.json', 'utf8'));

const spam = new Set();

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
	//bot.user.setActivity('$help', {type: "WATCHING"})
	bot.user.setPresence({game:{name: '$help',type:0}});
  
	//steam.getUserSummary('76561198369201133').then(summary => {
	//	console.log(summary);
	//});
});

function getLevel(level){
	var badges;
	var data = [[0,'Herald[0]'],[1,'Herald[1]'],[2,'Herald[2]'],[3,'Herald[3]'],[4,'Herald[4]'],[5,'Herald[5]'],
				[6,'Guardian[0]'],[7,'Guardian[1]'],[8,'Guardian[2]'],[9,'Guardian[3]'],[10,'Guardian[4]'],[11,'Guardian[5]'],
				[12,'Crusader[0]'],[13,'Crusader[1]'],[14,'Crusader[2]'],[15,'Crusader[3]'],[16,'Crusader[4]'],[17,'Crusader[5]'],
				[18,'Archon[0]'],[19,'Archon[1]'],[20,'Archon[2]'],[21,'Archon[3]'],[22,'Archon[4]'],[23,'Archon[5]'],
				[24,'Legend[0]'],[25,'Legend[1]'],[26,'Legend[2]'],[27,'Legend[3]'],[28,'Legend[4]'],[29,'Legend[5]'],
				[30,'Ancient[0]'],[31,'Ancient[1]'],[32,'Ancient[2]'],[33,'Ancient[3]'],[34,'Ancient[4]'],[35,'Ancient[5]'],
				[36,'Divine[0]'],[37,'Divine[1]'],[38,'Divine[2]'],[39,'Divine[3]'],[40,'Divine[4]'],[41,'Divine[5]'],
				[42,'Divine Rank'],[43,'Divine Top 100'],[44,'Divine Top 10']];
	var isMatch = false;
	var i = 0;
	
	while(isMatch==false && i<data.length){
		if(data[i][0]==level) badges = data[i][1]
		i++;
	}
	
	return badges;
}

function userInfo(sender,user,level){
	var userCreated = user.createdAt.toString().split(' ');
	var userStatus;
	var userGame;
	if(user.presence.status==null){
		userStatus="Offline";
	}else{
		userStatus=user.presence.status;
	}
	if(user.presence.game==null){
		userGame="Nothing";
	}else{
		userGame=user.presence.game.name;
	}
	var msgSent;
	if(!userData[user.id]){
		msgSent = 0;
	}else{
		msgSent = userData[user.id].messageSent;
	}
	
	const embed = new Discord.RichEmbed()
	.setTitle("User Detail")
	.setAuthor(user.username+"'s profile", user.avatarURL)
	/*
	* Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
	*/
	.setColor(0x00AE86)
	.setDescription("Status : "+userStatus+", Playing "+userGame)
	.setFooter("requested by "+ sender.username +" | aura-bot a Simple Discord Bot", sender.avatarURL)
	.setImage(user.avatarURL)
	.setThumbnail("attachment://level.png")	/*
	* Takes a Date object, defaults to current date.
	*/
	.setTimestamp()
	.setURL("https://discord.js.org/#/docs/main/indev/class/RichEmbed")
	.addField("User ID",user.id, true)
	.addField("Badges",getLevel(level), true)
	.addField("Joined Discord On",userCreated[2] + ' ' + userCreated[1] + ', ' + userCreated[3],true)
	.addField("Messages Sent",msgSent+" Messages",true);

	return {embed, files: [{attachment: 'assets/img/lvl/'+level+'.png', name: 'level.png'}]};
}

bot.on('message', message => {
	var sender = message.author;
	var msg = message.content.toUpperCase();
	var prefix = '$';
	
	if(message.author.bot) return;
	//if(message.content.indexOf(prefix) !== 0) return;
	
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift();
	
	//leveling system
	
	if (spam.has(sender.id)) {
		//message.channel.send("Wait");
	} else {
		sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
			if (!row) {
				sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 0]);
			} else {
				let curLevel = Math.floor(0.1 * Math.sqrt(row.points + 1));
				let earnedPoints = row.points + (Math.floor(Math.random() * 50) + 10);
				if (curLevel > row.level) {
					row.level = curLevel;
					sql.run(`UPDATE scores SET points = ${earnedPoints}, level = ${row.level} WHERE userId = ${message.author.id}`);
					let badges = getLevel(curLevel);
					message.channel.send(`Congratulations ${sender}, You earned ${badges}!`);
				}
				sql.run(`UPDATE scores SET points = ${earnedPoints}, level = ${row.level} WHERE userId = ${message.author.id}`);
			}
		}).catch(() => {
			console.error;
			sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)").then(() => {
				sql.run("INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 0]);
			});
		});
		
		spam.add(sender.id);
		setTimeout(() => {
			// Removes the user from the set after a minute
			spam.delete(sender.id);
		}, 60000);
	}
	
	if (msg === prefix + 'POINTS'){
		sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
			if (!row) return message.reply("sadly you do not have any points yet!");
			message.reply(`you currently have ${row.points} points, good going!`);
		});
	}
	
	if (msg === prefix + 'RANK'){
		sql.all(`SELECT * FROM scores ORDER BY points DESC`).then(rows => {
			var leaderboard = '';
			var i =1;
			rows.forEach(function(row) {
				var name = bot.users.get(row.userId);
				var badges = getLevel(row.level);
				leaderboard += `${i}. ${name}\nBadges: ${badges} Points: ${row.points}\n`;
				i++;
			})
			message.channel.send({
				embed: {
					title: "Leaderboard",
					color: 3447003,
					description: `${leaderboard}`
				}
			});
		});
	}
	
	if (msg === prefix + 'LEVEL'){
		sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
			if (!row) return message.reply("Your current level is 0");
			var level = row.level;
			var scores = row.points;
			var nextlevel = level + 1;
			var nextscores = nextlevel*nextlevel;
			var nextscores = nextscores * 100;
			
			const embed = new Discord.RichEmbed()
			.setAuthor(sender.username+"'s level", sender.avatarURL)
			.addField("Your current level is : ","**"+getLevel(level)+"**")
			.addField("Point Progress : ",scores+"/"+nextscores)
			.setColor(0x00AE86)
			.setFooter("aura-bot a Simple Discord Bot", bot.avatarURL)
			.setThumbnail("attachment://level.png")
			.setTimestamp()
			.setURL("https://discord.js.org/#/docs/main/indev/class/RichEmbed")
			message.channel.send({embed, files: [{attachment: 'assets/img/lvl/'+level+'.png', name: 'level.png'}]});
		});
	}
	
	if (msg === prefix + 'CLEARTABLE'){
		if(!message.member.roles.some(r=>["Invoker God", "Admin"].includes(r.name)) )
		return message.reply("Sorry, you don't have permissions to use this!");
		sql.get(`DELETE FROM scores`).then(row => {
			message.channel.send(`Table has been cleared.`);
		});
	}
	
	if(command === 'resetrow' && args[0]!=null){
		if(!message.member.roles.some(r=>["Invoker God", "Admin"].includes(r.name)) )
		return message.reply("Sorry, you don't have permissions to use this!");
		sql.get('UPDATE scores SET level=0, points=0 WHERE UserId ='+args[0]+'').then(row => {
			message.channel.send(`Row has been updated.`);
		});
	}
	
	if(command === 'setpoints' && args[0]!=null){
		if(!message.member.roles.some(r=>["Invoker God", "Admin"].includes(r.name)) )
		return message.reply("Sorry, you don't have permissions to use this!");
		sql.get(`UPDATE scores SET points = 193600 WHERE UserId = '174421170047811584'`).then(row => {
			message.channel.send(`Points has been updated.`);
		});
	}
	
	if(command === 'setlevel' && args[0]!=null){
		if(!message.member.roles.some(r=>["Invoker God", "Admin"].includes(r.name)) )
		return message.reply("Sorry, you don't have permissions to use this!");
		sql.get(`UPDATE scores SET level = 44 WHERE UserId = '174421170047811584'`).then(row => {
			message.channel.send(`Level has been updated.`);
		});
	}
	
	//--leveling system
	
	if(command === 'userinfo' && args[0]!=null){
		if(message.mentions.users.first()) { //Check if the message has a mention in it.
				let user = message.mentions.users.first(); //Since message.mentions.users returns a collection; we must use the first() method to get the first in the collection.
				sql.get(`SELECT * FROM scores WHERE userId ="${user.id}"`).then(row => {
					var level = row.level;
					message.channel.send(userInfo(sender,user,level));
				});
		} else {
			  message.reply("Invalid user."); //Reply with a mention saying "Invalid user."
		}
	}
	
	if (msg === prefix + 'HELP'){
		message.channel.send(commandsList);
	}
	
	if (msg === prefix + 'USERINFO'){
		sql.get(`SELECT * FROM scores WHERE userId ="${sender.id}"`).then(row => {
			var level = row.level;
			message.channel.send(userInfo(sender,sender,level));
		});
	}

	if (msg === 'ASSALAMUALAIKUM' || msg === prefix + 'ASSALAMUALAIKUM'){
		message.channel.send(`Waalaikumsalam ${sender} :smiley:`);
	}
	
	if (msg === `ASTAGHFIRULLAH` || msg === `ASTAGFIRULLAH`){
		message.channel.send('Alhamdulillah udah taubat :smiley:');
	}
	
	var substring = ["SHIT","FUCK","ANJING","AJG","FCK","TAI","GBLK","GOBLOK","GOBLOG","GBLG","FVCK"];
	var isRude = false;
	var i = 0;
	while(isRude==false && i<substring.length){
		isRude = msg.includes(substring[i]);
		i++;
	}
	
	if(msg.includes(':SANS:')){
		message.channel.send('Foto emoji siapa itu? cantik yah :relaxed: ');
	}
	
	if(isRude==true){
		message.delete();
		message.channel.send('Istighfar ka jangan ngomong kasar...');
	}
	
	if(message.channel.id === ''){
		if(isNaN(message.content)){
			message.delete();
		} else {
			sender.send('Please only post the number.');
		}
	}
	
	//username check
    if (!userData[sender.id]) userData[sender.id] = {messageSent: 0}    
	if (userData[sender.id])  userData[sender.id].messageSent++;
    //increase msg write to final file
    //userData[sender.id].messageSent++;

    //
    fs.writeFile('storage/userData.json', JSON.stringify(userData), (err) => {
        if (err) console.error(err); //error logging
    });

});

bot.on('message', async message => {
	
	var sender = message.author;
	var msg = message.content.toUpperCase();
	var prefix = '$'
	
	if(message.author.bot) return;
	if(message.content.indexOf(prefix) !== 0) return;
	
	if (msg === prefix + 'PING'){
		const m = await message.channel.send('Ping?');
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp} ms`);
	}
	
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift();
	
	if(command === "say") {
		if(!message.member.roles.some(r=>["Invoker God", "Admin"].includes(r.name)) )
			return message.reply("Sorry, you don't have permissions to use this!");
		const sayMessage = args.join(" ");
		// Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
		message.delete().catch(O_o=>{}); 
		// And we get the bot to say the thing: 
		message.channel.send(sayMessage);
		
	}
	
	if(command === "steam"){
		if(args[0] === "url"){
			if(args[1].includes('id')){
				steam.resolve(args[1]).then(id => {
					steam.getUserSummary(id).then(summary => {
						const embed = new Discord.RichEmbed()
						.setTitle("Steam Profile")
						.setAuthor(summary.nickname, summary.avatar.small)
						/*
						* Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
						*/
						.setColor(0x00AE86)
						.setDescription("Steam ID : "+ summary.steamID)
						.setFooter("This is the footer text, it can hold 2048 characters", "http://i.imgur.com/w1vhFSR.png")
						.setImage("http://i.imgur.com/yVpymuV.png")
						.setThumbnail("http://i.imgur.com/p2qNFag.png")
						/*
						* Takes a Date object, defaults to current date.
						*/
						.setTimestamp()
						.setURL("https://discord.js.org/#/docs/main/indev/class/RichEmbed")
						.addField("This is a field title, it can hold 256 characters",
						"This is a field value, it can hold 2048 characters.")
						/*
						* Inline fields may not display as inline if the thumbnail and/or image is too big.
						*/
						.addField("Inline Field", "They can also be inline.", true)
						/*
						* Blank field, useful to create some space.
						*/
						.addBlankField(true)
						.addField("Inline Field 3", "You can have a maximum of 25 fields.", true);

						message.channel.send({embed});
					});
				});
			}
		}
	}
	
});

bot.login('NDM2MDYzNjU5ODM2NTcxNjQ5.DbiEcg._A8XkEn7bvQY3sXTGdIJcFFor5A');
