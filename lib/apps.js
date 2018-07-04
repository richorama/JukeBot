/**
 * Helpers for configuring a bot as an app
 * https://api.slack.com/slack-apps
 */

var Botkit = require('botkit');

var _bots = {};

function _trackBot(bot) {
    _bots[bot.config.token] = bot;
}

function die(err) {
    console.log(err);
    process.exit(1);
}

module.exports = {
    configure: function (port, clientId, clientSecret, config, onInstallation) {
        var controller = Botkit.slackbot(config).configureSlackApp(
            {
                clientId: clientId,
                clientSecret: clientSecret,
                scopes: ['bot'], //TODO it would be good to move this out a level, so it can be configured at the root level
            }
        );

        controller.setupWebserver(port,function(err,webserver) {
            controller.createWebhookEndpoints(controller.webserver);

            controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
                if (err) {
                    res.status(500).send('ERROR: ' + err);
                } else {
                    res.send('Success!');
                }
            });
        });

        function startRTM(bot){
            bot.startRTM(function (err) {
                if (err) {
                    die(err);
                }

                _trackBot(bot);

                if (err) {
                    console.log('Failed to start RTM')
                    return setTimeout(startRTM, 10000);
                }
                    console.log("RTM started!");
            });
        }

        controller.on('create_bot', function (bot, config) {
            // already online! do nothing.
            if (_bots[bot.config.token]) return;

            startRTM(bot);
            
            if (onInstallation) onInstallation(bot, config.createdBy);
        });


        controller.storage.teams.all(function (err, teams) {

            if (err) {
                throw new Error(err);
            }

            // connect all teams with bots up to slack!
            for (var t in teams) {
                if (teams[t].bot) {
                    var bot = controller.spawn(teams[t])
                    startRTM(bot);
                }
            }
        });

        controller.on('rtm_close', function(bot, err) {
            startRTM(bot);
        });

        return controller;

    }
}
