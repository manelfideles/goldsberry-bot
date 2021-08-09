const { GuildAuditLogsEntry } = require('discord.js');
const fetch = require('node-fetch');

const name = 'stats';
const description = 'Displays season averages of player (-p) or general stats for teams (-t)';
const args = 'true';
const usage = '!stats -[pt] <player/team name>';

function execute(message, args) {
    console.log('!stats was called 🏀');
    var callbackArgs = [args[1], args[2], message, args[0]];

    // callbackArgs = [playerName, playerSurname, message, args[0]];
    if (args[0] == '-p') fetchSeasonYear(callbackArgs, setPlayerIdUrl);

    // callbackArgs = [teamCode, undefined, message, args[0]];
    else if (args[0] == '-t') fetchSeasonYear(callbackArgs, fetchTeamStats);

}

function fetchSeasonYear(args, callback) {
    // args = [playerName, playerSurname, message, args[0]];
    // args = [teamName, undefined, message, args[0]];

    const url = 'http://data.nba.net/data/10s/prod/v1/calendar.json';

    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            args.push(json
                .startDateCurrentSeason
                .slice(0, 4));

            let messageTypeFlag = args[args.length - 2];
            if (messageTypeFlag == '-p')
                callback(args, fetchPlayerId);
            else
                callback(args, sendTeamStats);
        }).catch(err => {
            console.log(`[fetchSeasonYear] => ${err}`);
        });
}

function setPlayerIdUrl(args, callback) {
    // args = [playerName, playerSurname, message, year];
    let year = args[4];
    args.push(
        `https://data.nba.net/10s/prod/v1/${year}/players.json`
    );
    callback(args, fetchPlayerAverages);
}

function fetchPlayerId(args, callback) {
    [playerName, playerSurname, message, _, year, url] = args;
    var personId = '';
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
                            console.log(`playerId => ${personId}`);
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
                    // args = playerName, playerSurname, message, _, year, personId
                    callback(args, sendPlayerStats);
                }
                else message.reply("There's no such player! Please rewrite his name or find a player that actually exists.");
            })
            .catch(err => {
                console.log(`[fetchPlayerId] => ${err}`);
            });
    }
    else console.log('⚠️  URL is undefined');
}

function fetchPlayerAverages(args, callback) {
    // args = [playerName, playerSurname, message, year, personId]
    [playerName, playerSurname, message, _, year, playerId] = args;
    let url = `https://data.nba.net/data/10s/prod/v1/${year}/players/${playerId}_profile.json`;
    console.log(`playerURL => ${url}`);

    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            let stats = json.league.standard.stats.regularSeason.season[0].teams[0];
            let playerStats = [
                `:bucket: ${stats.ppg} ppg\n`,
                `🎬 ${stats.rpg} rpb\n`,
                `🎯 ${stats.apg} apg\n`,
                `🕵️ ${stats.spg} spg\n`,
                `✋ ${stats.bpg} bpg\n`,
                `🔄 ${stats.topg} topg\n`,
                `**FG%**: ${stats.fgp}%\n`,
                `**3PT%**: ${stats.tpp}%\n`,
                `**FT%**: ${stats.ftp}%\n`,
            ];
            args.splice(3, 3);
            args.push(playerStats);
            callback(args);
        })
        .catch((err) => {
            console.log(`[fetchPlayerAverages] => ${err}`);
        });
}

function sendPlayerStats(args) {
    [playerName, playerSurname, message, stats] = args;
    let botReply = `\n**${playerName} ${playerSurname}**'s season averages:\n`;
    for (let i = 0; i < stats.length; i++) botReply += stats[i];
    message.reply(botReply);
    console.log('Done!');
}

function fetchTeamStats(args, callback) {
    args.splice(1, 1); args.splice(2, 1);
    [teamCode, message, year] = args;
    let url = `http://data.nba.net/data/10s/prod/v1/${year}/team_stats_rankings.json`;
    console.log('=>', url);
    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            if (!json.Message) {
                let regSeasonTeams = json.league.standard.regularSeason.teams;
                var regularSeasonStats = [];
                // let playoffTeams = json.league.standard.regularSeason.teams;
                // let playoffsStats = [];

                for (let i = 0; i < regSeasonTeams.length; i++) {
                    const team = regSeasonTeams[i];
                    if (team.teamcode.toLowerCase() == teamCode.toLowerCase()) {
                        regularSeasonStats = [
                            `:bucket: ${team.ppg.avg} ppg (#${team.ppg.rank})\n`,
                            `🎬 ${team.trpg.avg} rpg (#${team.trpg.rank})\n`,
                            `🎯 ${team.apg.avg} apg (#${team.apg.rank})\n`,
                            `🕵️ ${team.spg.avg} spg (#${team.spg.rank})\n`,
                            `✋ ${team.bpg.avg} bpg (#${team.bpg.rank})\n`,
                            `🔄 ${team.trpg.avg} tpg (#${team.trpg.rank})\n`,
                            `**FG%**: ${team.fgp.avg * 100}% (#${team.fgp.rank})\n`,
                            `**3PT%**: ${team.tpp.avg * 100}% (#${team.tpp.rank})\n`,
                            `**FT%**: ${team.ftp.avg * 100}% (#${team.ftp.rank})\n`,
                        ];
                        break;
                    }
                }
                if (regularSeasonStats) {
                    args.push(regularSeasonStats)
                    callback(args);
                }
                else message.reply("There's no such team! Please rewrite its name or find a team that actually exists.");
            }
            else message.reply('stats not available at the moment!');
        })
        .catch(err => {
            console.log(`[fetchTeamStats] => ${err}`);
        });
}

function sendTeamStats(args) {
    [teamName, message, _, stats] = args;
    let botReply = `\n**${teamName}**'s season averages:\n`;
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