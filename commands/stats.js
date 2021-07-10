const { GuildAuditLogsEntry } = require('discord.js');
const fetch = require('node-fetch');

const name = 'stats';
const description = 'Displays season averages of player (-p) or general stats for teams (-t)';
const args = 'true';
const usage = '!stats -[pt] <player/team name>';

function execute(message, args) {
    console.log('!stats was called 🏀');
    if (args[0] == '-p') {
        let callbackArgs = [args[1], args[2], message];
        fetchSeasonYear(callbackArgs, setPlayerIdUrl);
    }
    else if (args[0] == '-t') {
        console.log('nothing yet :)');
        return;
    }
}

function fetchSeasonYear(args, callback) {
    // args = [name, surname, message]
    const url = 'http://data.nba.net/data/10s/prod/v1/calendar.json';

    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            args.push(json
                .startDateCurrentSeason
                .slice(0, 4));
            callback(args, fetchPlayerId);
        }).catch(err => {
            console.log(`[fetchSeasonYear] => ${err}`);
        });
}

function setPlayerIdUrl(args, callback) {
    // args = [name, surname, message, year]
    let year = args[3];
    //console.log(`Season: ${year}/${parseInt(year) + 1}`);
    args.push(
        `https://data.nba.net/10s/prod/v1/${year}/players.json`
    );
    callback(args, fetchPlayerAverages);
}

function fetchPlayerId(args, callback) {
    // args = [name, surname, message, year, url]
    [playerName, playerSurname, message, year, url] = args;
    var personId = '';
    //console.log(`url => ${url}`);

    if (url) {
        fetch(url, { method: "Get" })
            .then(res => res.json())
            .then((json) => {
                if (json.league) {
                    var playerArray = json.league.standard;
                    for (let i = 0; i < playerArray.length; i++) {
                        const player = playerArray[i];
                        if (
                            player.firstName.toLowerCase() == playerName.toLowerCase()
                            && player.lastName.toLowerCase() == playerSurname.toLowerCase()
                        ) {
                            personId = player.personId;
                            console.log(`Found ${playerName} ${playerSurname}'s playerId -> ${personId}`);
                            break;
                        }
                    }
                }
                return personId;
            })
            .then((personId) => {
                if (personId != '') {
                    args.pop();
                    args.push(personId);
                    // args = playerName, playerSurname, message, year, personId
                    callback(args, sendMessage);
                }
                else message.reply("There's no such player! Please rewrite his name or find a player that actually exists...");
            })
            .catch(err => {
                console.log(`[fetchPlayerId] => ${err}`);
            });
    }
    else console.log('⚠️  URL is undefined');
}

function fetchPlayerAverages(args, callback) {
    // args = [playerName, playerSurname, message, year, personId]
    [playerName, playerSurname, message, year, playerId] = args;
    let url = `https://data.nba.net/data/10s/prod/v1/${year}/players/${playerId}_profile.json`;
    console.log(`playerURL => ${url}`);

    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            let stats = json.league.standard.stats.regularSeason.season[0].total;
            let playerStats = [
                `:bucket: ${stats.ppg} ppg\n`,
                `🎬 ${stats.rpg} rpb\n`,
                `🎯 ${stats.apg} apg\n`,
                `🕵️ ${stats.spg} spg\n`,
                `✋ ${stats.bpg} bpg\n`,
                `🔄 ${stats.topg} topg\n`,
            ];
            args.splice(3, 2);
            args.push(playerStats);
            callback(args);
        })
        .catch((err) => {
            console.log(`[fetchPlayerAverages] => ${err}`);
        });
}

function sendMessage(args) {
    [playerName, playerSurname, message, stats] = args;
    let botReply = `\n${playerName} ${playerSurname}'s season averages:\n`;
    for (let i = 0; i < stats.length; i++) botReply += stats[i];
    message.reply(botReply);
    console.log('Done!');
}

module.exports = {
    name,
    description,
    args,
    usage,
    execute
};