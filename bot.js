const Discord = require('discord.js');
const fs = require('fs');
const ini = require('ini');

// Load configuration.
var configFile;

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

const config = ini.parse(configFile);

// For logging
if(!fs.existsSync("logs/"))
{
	fs.mkdirSync("logs");
}

var logNum = 0;
while(fs.existsSync("logs/log-" + logNum + ".log")) { logNum++; }

var logFile = "logs/log-" + logNum + ".log";

function log(str)
{
	var time = new Date().toISOString();
	time = time.replace('T', ' ');
	time = time.replace(/\..+/, '');
	time = "[" + time + "] ";


	fs.appendFile(logFile, time + str + "\n", (err) => {
		if(err)
		{
			console.error(err);
			console.error("Failed to write to log file. Closing process.");
			process.exit(1);
		}
	});

	console.log(str);
}

log("Server started.");

const client = new Discord.Client();

client.on('ready', () => {
	log("Connected to Discord.")
});

client.on('message', msg => {

});

client.login(config.Configuration.Secret);