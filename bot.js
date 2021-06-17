// Imports
const Discord = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();


const client = new Discord.Client();

client.on('ready', () => {
    console.log("I'm alive 🏀");
})

client.login(process.env.TOKEN);

/*
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interaction', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

client.login('token');
*/