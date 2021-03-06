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
	fs.writeFileSync("./config.ini", "[Configuration]\nSecret=SECRET HERE\n");
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

function assignRoles(guild)
{
	guild.members.fetch().then(arr => {
		console.log("Hewwo?");
		console.log(arr);
	}).catch(err => {
		log(err);
		log("Failed to fetch member list.");
	});
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
	}
});

////////////////////////////////////////////////////////////////////////////////////
//
//								BEGIN
//
////////////////////////////////////////////////////////////////////////////////////

log("Server started.");
client.login(config.Configuration.Secret);