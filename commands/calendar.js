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
    var flag = args[0];
    var team = args[1];
    // if -n || -w, we don't need the 'team' arg
    if (flag && flag != '-t') callbackArgs = [flag, message];
    else callbackArgs = [flag, team, message];

    //console.log(callbackArgs);
    fetchSeasonYear(callbackArgs);
}

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

function fetchSeasonYear(args) {
    // args = [flag, team, message];
    // args = [flag, message];

    const dateUrl = 'http://data.nba.net/data/10s/prod/v1/calendar.json';

    fetch(dateUrl, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            var curSeasonYear = json
                .startDateCurrentSeason
                .slice(0, 4);
            const scheduleUrl = `http://data.nba.net/data/10s/prod/v1/${curSeasonYear}/schedule.json`;

            const curDateStr = getDateString(new Date());
            if (args[0] == '-n')
                findGames(scheduleUrl, [curDateStr], args);
            else {
                // 5-day span
                var finDate = new Date();
                finDate.setDate(finDate.getDate() + 5);
                finDateStr = getDateString(finDate);
                findGames(scheduleUrl, [curDateStr, finDateStr], args);
            }

        }).catch(err => {
            console.log(`[fetchSeasonYear] => ${err}`);
        });
}


function findGames(scheduleUrl, interval, args) {
    fetch(scheduleUrl, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            const leagues = Object.keys(json.league);
            for (let i = 0; i < leagues.length; i++) {
                allGames = json.league[leagues[i]];
                for (let j = 0; j < allGames.length; j++) {
                    // today's games
                    game = allGames[j];
                    if (interval.length == 1) {
                        if (game.startDateEastern === interval[0]) {
                            console.log(
                                `[${game.gameUrlCode}] ${game.startDateEastern} at ${game.startTimeEastern}`
                            );
                        }
                    }
                    // this week's games
                    else {
                        if (
                            game.startDateEastern >= interval[0]
                            && game.startDateEastern <= interval[1]
                        ) {
                            //if(args.length == 3 && )
                            console.log(
                                `[${game.gameUrlCode}] ${game.startDateEastern} at ${game.startTimeEastern}`
                            );
                        }
                    }
                }
            }


        }).catch(err => {
            console.log(`[findGamesToday] => ${err}`);
        });
}

function findGamesThisWeek() {

}

function filterTeamGames() {

}

module.exports = {
    name,
    description,
    args,
    usage,
    execute
};