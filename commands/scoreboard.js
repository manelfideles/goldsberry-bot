module.exports = {
    name: 'scoreboard',
    description: 'Fetches latest scoreboard data within a 24-hour span',
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
        let gameName = '📍 ';
        let score = '🏀 ';
        let live = '';
        let clock = '';

        // Requests JSON with scoreboard info
        fetch(url, { method: "Get" })
            .then(res => res.json())
            .then((json) => {
                console.log("Got latest full-game scoreboard 🏀");

                var gameArray = json.games;
                gameArray.forEach((game) => {
                    gameName = `${game.vTeam.triCode} @ ${game.hTeam.triCode}`
                    score = `${game.hTeam.triCode} ${game.hTeam.score} - ${game.vTeam.score} ${game.vTeam.triCode}`
                    clock = `${game.clock}`;
                    if (game.isGameActivated)
                        live = `🔴 LIVE : ${clock}\n`;
                    else if (game.playoffs)
                        live = `📈 ${game.playoffs.seriesSummaryText}\n`
                    botReply += `\n📍${gameName} \n🏀${score} \n${live}`;
                });

                //console.log(botReply);
                return message.reply(botReply);
            })
    }
}