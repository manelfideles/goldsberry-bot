// check start year with calendar request -> "startDateCurrentSeason" field -> extract current season year

// if -n (now):
// 1 - make schedule request
// 2 - json.find(games with today's date)
// return games

// if -t (team) ex: -t sixers:
// 1 - make teams request -> extract team's tricode
// 1 - json.find(games where "gameUrlCode" contains team's tricode && date >= today)

// if -w (week) display games for the next 5 days

const { GuildAuditLogsEntry } = require('discord.js');
const fetch = require('node-fetch');

const name = 'calendar';
const description = 'Displays upcoming games for a specific team (-t) or just games for today (-n)';
const args = 'true';
const usage = '!calendar -[nwt] <team name if -t>';

function execute(message, args) {
    console.log('!calendar was called 🏀');

    let flag = args[0];
    let usedFlag = flag.match('/^-[nwt]{1}/');
    let team = args[1];

    if (usedFlag)
        // extra [] for temp data needed during callback chain execution
        if (!usedFlag.includes('-t'))
            fetchSeasonYear(
                [flag, message, []],
                findGames
            );
        else
            fetchSeasonYear(
                [flag, message, [team]],
                teamExists
            );
    else message.reply(`Invalid flag! **Usage: ${this.usage}**`);
}

/**
 * Gets season start year 
 * and inserts it into args array.
 * 
 * @param {Array} args 
 * @param {Function} callback 
 */
function fetchSeasonYear(args, callback) {
    // args = [flag, message, []];
    // args = [flag, message, [team]]; 

    const dateUrl = 'http://data.nba.net/data/10s/prod/v1/calendar.json';

    fetch(dateUrl, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            let curSeasonYear = json
                .startDateCurrentSeason
                .slice(0, 4);

            // put season start year and current date in temp variable bucket
            args[args.length - 1].push(
                curSeasonYear
            );

            if (args[0] == '-t') callback(args, findGames); // callback = teamExists
            else { callback(args, sendCalendar); } // callback = findGames
        }).catch(err => {
            console.log(`[fetchSeasonYear] => ${err}`);
        });
}

/**
 * Tests if team exists.
 * Replaces inserted team name for 'teamId' property.
 * 
 * @param {Array} args 
 * @param {Function} callback 
 */
function teamExists(args, callback) {
    // args = [flag, message, [team]]; 
    // args = [flag, message, []];

    let url = `http://data.nba.net/data/10s/prod/v1/${args[args.length - 1][1]}/teams.json`;

    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            let teams = json.league.standard;
            for (let i = 0; i < teams.length; i++) {
                const team = teams[i];
                const validTeamNames = [
                    team["city"].toLowerCase(),
                    team["fullName"].toLowerCase(),
                    team["tricode"].toLowerCase(),
                    team["nickname"].toLowerCase(),
                    team["urlName"].toLowerCase(),
                ];

                // replace team for teamId
                if (validTeamNames.includes(args[args.length - 1][0])) {
                    args[args.length - 1][0] = team["teamId"];
                    console.log(`Inserted teams's teamId -> ${args[args.length - 1][0]}`);
                    return callback(args, sendCalendar);
                }
            }
            args[1].reply(
                "There's no such team! Pick a team that actually exists"
            );

        }).catch(err => { console.log(`[teamExists] => ${err}`); });
}

/**
 * findGames for 
 * @param {Array} args 
 * @param {Function} callback 
 */
function findGames(args, callback) {
    [flag, message, data] = args;
    let team;
    if (flag == '-t') { team = data[0]; data.shift(); }
    data.push(getDateString(new Date())); // [curSeasonYear, today, (endDate)];

    let url = `http://data.nba.net/data/10s/prod/v1/${data[0]}/schedule.json`;
    fetch(url, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            const leagues = Object.keys(json.league);
            for (let i = 0; i < leagues.length; i++) {
                leagueGames = json.league[leagues[i]];
                let lastLeagueGame = leagueGames[leagueGames.length - 1];

                // skip league if empty or finished
                if (!leagueGames.length || (lastLeagueGame && lastLeagueGame.startDateEastern < data[1]))
                    continue;

                let matches = [];
                if (flag == '-n')
                    matches = gamesToday(leagueGames, data);
                else {
                    let finDate = new Date();
                    finDate.setDate(finDate.getDate() + 49);
                    data.push(getDateString(finDate));
                    matches = gamesThisWeek(leagueGames, data);
                    if (flag == '-t') matches = filterTeamGames(matches, team);
                }
                if (!matches.length) {
                    message.reply("there are no matches to be displayed :frowning:");
                    console.log("Done!");
                    return;
                }
                callback(message, matches);
            }
        }).catch(err => { console.log(`[findGames] => ${err}`); });
}

function gamesToday(games, data) {
    let result = [];
    games.forEach(game => {
        if (game.startDateEastern == data[1])
            result.push(getGameInfo(game));
    });
    return result;
}

function gamesThisWeek(games, data) {
    let result = [];
    games.forEach(game => {
        if (game.startDateEastern >= data[1] && game.startDateEastern <= data[2])
            result.push(getGameInfo(game));
    });
    return result;
}

/**
 * Filters 5-day match array.
 * 
 * @param {Array} weekMatches
 * @param {String} teamId
 * @returns Upcoming team's games.
 */
function filterTeamGames(games, teamId) {
    return games.filter(game => game[3].includes(teamId));
}

// Helper functions
function getDateString(date) {
    let [month, day, year] = [
        date.getMonth() + 1,
        date.getDate(),
        date.getFullYear()
    ];
    if (day < 10) day = `0${day}`;
    if (month < 10) month = `0${month}`;
    return `${year}${month}${day}`;
}

function getReorderedDateStr(dateStr) {
    let [year, month, day] = [
        dateStr.slice(0, 4),
        dateStr.slice(4, 6),
        dateStr.slice(6, dateStr.length),
    ];
    return `${day}-${month}-${year}`;
}

function getTeamsFromUrlCode(gameUrlCode) {
    let teams = gameUrlCode.split('/').pop();
    return `${teams.slice(0, 3)} @ ${teams.slice(3)}`;
}

function getGameInfo(game) {
    return [
        `\n:calendar_spiral: ${getReorderedDateStr(game.startDateEastern)}`, // 'DD-MM-YYYY'
        `\n:alarm_clock: ${game.startTimeEastern}`, // 'HH:MM [AM|PM] ET'
        `\n:round_pushpin: ${getTeamsFromUrlCode(game.gameUrlCode)}`, // 'vTeam @ hTeam'
        [game["hTeam"]["teamId"], game["vTeam"]["teamId"]]
    ];
}

function sendCalendar(message, games) {
    let botReply = '\n';
    for (let i = 0; i < games.length; i++) {
        games[i].pop();
        botReply += games[i] + '\n';
    }
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