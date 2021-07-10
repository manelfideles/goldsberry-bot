/**
 * @author : Manuel Fideles
 * @education : 3rd year CompSci student @ DEI-UC
 * @github : https://github.com/manelfideles/goldsberry-bot
 * @api : http://data.nba.net/
*/

// Imports and configs
const Discord = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');
const config = require('./config.json');
const commandDir = fs.readdirSync('./commands');

// Setup
dotenv.config();
const client = new Discord.Client();
client.commands = new Discord.Collection();

client.login(config.token);
client.on('ready', () => { console.log(`I'm alive! Logged in as ${client.user.tag} 🏀`); })


/**
 * Set a new item in the Collection
 * with the key as the command name and
 * the value as the exported module 
 */

commandFiles = commandDir.filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Handling
client.on('message', message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    /* console.log(`Command - '${commandName}'`);
    console.log(`Args - '${args}'`); */

    if (!client.commands.has(commandName)) return;

    try {
        const command = client.commands.get(commandName);
        if (command.args && !args.length) {
            return message.channel.send(
                `⚠️ You didn't provide any arguments, ${message.author}!\n✅ Command !${commandName}'s usage: **${command.usage}**`
            );
        } else {
            command.execute(message, args);
        }
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

