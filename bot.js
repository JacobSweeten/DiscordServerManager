const Discord = require('discord.js');
const fs = require('fs');
const ini = require('ini');

////////////////////////////////////////////////////////////////////////////////////
//
//								CONFIGURATION
//
////////////////////////////////////////////////////////////////////////////////////

// Configuration file buffer.
var configFile;

// If config file does not exist, create it and close.
try
{
	configFile = fs.readFileSync("./config.ini", "utf-8");
}
catch(e)
{
	fs.writeFileSync("./config.ini", "[Configuration]\nSecret=SECRET HERE\nNoAssignRoles=role1, role2\nNoKickRoles=role1, role2\n");
	console.log("Created INI file. Please fill in details and restart server.");
	process.exit(0);
}

// Parse config file.
const config = ini.parse(configFile);

////////////////////////////////////////////////////////////////////////////////////
//
//								LOGGING
//
////////////////////////////////////////////////////////////////////////////////////

// If the log folder does not exit, create it.
if(!fs.existsSync("logs/"))
{
	fs.mkdirSync("logs");
}

// Do not overwrite old logs.
var logNum = 0;
while(fs.existsSync("logs/log-" + logNum + ".log")) { logNum++; }

var logFile = "logs/log-" + logNum + ".log";

// Master function for logging. Outputs to both log file and console.
function log(str)
{
	// Create datestamp.
	var time = new Date().toISOString();
	time = time.replace('T', ' ');
	time = time.replace(/\..+/, '');
	time = "[" + time + "] ";

	// Output to log file.
	fs.appendFile(logFile, time + str + "\n", (err) => {
		if(err)
		{
			console.error(err);
			console.error("Failed to write to log file. Closing process.");
			process.exit(1);
		}
	});

	// Output to console.
	console.log(time + str);
}

////////////////////////////////////////////////////////////////////////////////////
//
//								DISCORD
//
////////////////////////////////////////////////////////////////////////////////////

const client = new Discord.Client({ws:{intents:['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES']}});

var reconnectInterval;

var noAssignRoles = config.Configuration.NoAssignRoles.replace(/\s*,\s*/g, ',').split(",");
var noKickRoles = config.Configuration.NoKickRoles.replace(/\s*,\s*/g, ',').split(",");

var toConfirm = [];

function assignRoles(guild)
{
	// Fetch user list
	guild.members.fetch().then(users => {

		// Iterare over users
		var userArr = users.array();
		var assignArr = [];
		for(var i = 0; i < userArr.length; i++)
		{
			// Iterate over each user's roles
			var roles = userArr[i].roles.cache.array();
			var assign = true;
			for(var j = 0; j < roles.length; j++)
			{
				// If the user has a special role, do not add to list.
				if(noAssignRoles.includes(guild.roles.resolve(roles[j]).name))
				{
					assign = false;
				}
			}
			
			// Id the user does not have a special role, add to list.
			if(!assign)
			{
				assignArr.push(userArr[i]);
			}
		}

		// Shuffle the array
		for(var i = 0; i < 500; i++)
		{
			var idx1 = Math.floor(Math.random() * assignArr.length);
			var idx2 = Math.floor(Math.random() * assignArr.length);

			var temp = userArr[idx1];
			userArr[idx1] = userArr[idx2];
			userArr[idx2] = temp;
		}

		console.log(userArr);

		// TODO: Finish

	}).catch(err => {
		log(err);
		log("Failed to fetch member list.");
	});
}

function create(n, guild)
{
	for(let i = 1; i <= n; i++)
	{
		// Create role
		guild.roles.create({
			data: {
				name: "Breakout " + i
			}
		}).then(role => {
			// Create category
			guild.channels.create("BREAKOUT " + i, {
				type: "category",

			}).then(category => {
				// Update permissions
				category.updateOverwrite(guild.roles.everyone, {VIEW_CHANNEL: false, CONNECT: false});
				category.updateOverwrite(role, {VIEW_CHANNEL: true, CONNECT: true});

				// Create channels
				guild.channels.create("breakout-" + i, {
					parent: category,
				});
				guild.channels.create("Breakout " + i + " VC", {
					parent: category,
					type: "voice"
				});
			}).catch(err => {
				log("Failed to create category.");
			});
		}).catch("Failed to create role.");
	}
}

function clean(msg)
{
	// Get channels
	var channels = msg.guild.channels.cache.array();
	var delChannels = [];
	var delChannelsString = "";
	for(var i = 0; i < channels.length; i++)
	{
		if(channels[i].name.toLowerCase().startsWith("breakout"))
		{
			delChannels.push(channels[i]);
			delChannelsString += channels[i].name + "\n";
		}
	}

	// Get roles
	var roles = msg.guild.roles.cache.array();
	var delRoles = [];
	var delRolesString = "";
	for(var i = 0; i < roles.length; i++)
	{
		if(roles[i].name.toLowerCase().startsWith("breakout"))
		{
			delRoles.push(roles[i]);
			delRolesString += roles[i].name + "\n";
		}
	}

	// Alert user, queue confirmation.
	delChannelsString.substring(0, delChannelsString.length - 1);
	delRolesString.substring(0, delChannelsString.length - 1);
	msg.reply("\nYou are about to delete the following channels: \n" + delChannelsString + "\nAnd the following roles: \n" + delRolesString + "\n\n\nType $confirm to confirm.");
	toConfirm.push({user: msg.author.id, delChannels: delChannels, delRoles: delRoles});
}

function confirm(msg)
{
	// See if user is in the confirmation list.
	var confirmed = false;
	for(var i = 0; i < toConfirm.length; i++)
	{
		if(msg.author.id === toConfirm[i]["user"])
		{
			// Delete roles and channels.
			confirmed = true;
			for(var j = 0; j < toConfirm[i]["delChannels"].length; j++)
			{
				toConfirm[i]["delChannels"][j].delete();
			}

			for(var j = 0; j < toConfirm[i]["delRoles"].length; j++)
			{
				toConfirm[i]["delRoles"][j].delete();
			}
		}
	}

	// Delete the confirmation list.
	if(confirmed)
	{
		toConfirm = [];
	}
}

client.on('ready', () => {
	log("Connected to Discord.")
	clearInterval(reconnectInterval);
});

client.on('error', err => {
	log(err);
	log("Reconnecting in 5 seconds.");
	reconnectInterval = setInterval(() => {
		log("Attempting to reconnect.")
		client.login(config.Configuration.Secret);
	}, 5000);
});

client.on('message', msg => {
	var msgArr = msg.content.split(" ");
	var command = msgArr[0].toLowerCase();
	if(!command.startsWith("$")) return;

	log("Received command from user " + msg.author.username + ": \"" + command + "\".");

	switch(command)
	{
		case "$ping":
			msg.reply("Pong!");
			break;
		case "$assign":
			assignRoles(msg.guild);
			break;
		case "$create":
			if(msgArr.length === 1)
			{
				msg.reply("Usage: `$create n=10`");
				break;
			}

			var args = msgArr[1].split('=');
			if(args.length === 1)
			{
				msg.reply("Usage: `$create n=10`");
				break;
			}

			if(args[0] != "n" || Number(args[1]) == NaN)
			{
				msg.reply("Usage: `$create n=10`");
				break;
			}

			var n = Number(args[1]);
			if(n < 1 || n > 10)
			{
				msg.reply("n too large!");
			}
			else
			{
				create(n, msg.guild);
			}

			break;
		case "$clean":
			clean(msg);
			break;
		case "$confirm":
			confirm(msg);
			break;
	}
});

////////////////////////////////////////////////////////////////////////////////////
//
//								BEGIN
//
////////////////////////////////////////////////////////////////////////////////////

log("Server started.");
client.login(config.Configuration.Secret);