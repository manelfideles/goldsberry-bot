/**
 * Usage: !scoreboard [-q]
 * Flags: 
 *      > -q : Display gamescore in each quarter
 */

module.exports = {
    name: 'scoreboard',
    description: 'Fetches latest scoreboard data within a 24-hour span. Score by quarters: !scoreboard -q',
    usage: '!scoreboard [-q]',
    execute(message, args) {
        const fetch = require('node-fetch');

        // Format date and request info
        var today = new Date();
        today.setDate(today.getDate() - 1);

        var date = today
            .toISOString()
            .slice(0, 10)
            .replaceAll('-', '');
        let url = `http://data.nba.net/10s/prod/v1/${date}/scoreboard.json`;

        // Bot message fields
        let botReply = '';
        let gameName = '';
        let score = '';
        let extraInfo = '';
        let clock = '';

        // Requests JSON with scoreboard info
        fetch(url, { method: "Get" })
            .then(res => res.json())
            .then((json) => {
                console.log("!scoreboard was called 🏀");
                var gameArray = json.games;
                if (gameArray.length == 0)
                    return message.reply('there are no games to display!');
                gameArray.forEach((game) => {
                    let scoreQuarters = '';
                    gameName = `${game.vTeam.triCode} @ ${game.hTeam.triCode}`
                    score = `${game.hTeam.triCode} ${game.hTeam.score} - ${game.vTeam.score} ${game.vTeam.triCode}`
                    clock = `${game.clock}`;

                    if (game.isGameActivated)
                        extraInfo = `🔴 LIVE : ${clock}\n`;
                    else if (game.playoffs)
                        extraInfo = `📈 ${game.playoffs.seriesSummaryText}\n`;

                    if (args == '-q' || args == '-quarters') {
                        const quarterEmojis = [':one:', ':two:', ':three:', ':four:'];
                        for (var i = 0; i < game.hTeam.linescore.length; i++)
                            scoreQuarters += `🇶${quarterEmojis[i]} ${game.hTeam.linescore[i].score} - ${game.vTeam.linescore[i].score}\n`;
                    }

                    botReply += `\n📍 ${gameName} \n${extraInfo}🏀 ${score}\n${scoreQuarters}`;
                });

                return message.reply(botReply);
            })
    }
}