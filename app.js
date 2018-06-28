var youtubeDl = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');
var localtunnel = require('localtunnel');
var app = require('./lib/apps');
var settings = require('./client_secret.json');

process.env.PORT = settings.port;

var playQueue = [];
var playing = false;


if (settings.subdomain){
    localtunnel(parseInt(settings.port), { subdomain:settings.subdomain }, (err,tunnel) => {
        if (err) return console.log("error", err);
        console.log(tunnel);
        tunnel.on("close", () => console.log("TUNNEL CLOSED") );
        tunnel.on("error", err => console.log("TUNNEL ERROR", err) );
    });
}

/*** */


/**
 * A Bot for Slack!
 */

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {
    json_file_store: "db_slack_bot_a", //use a different name if an app or CI
};

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

console.log(settings)
var controller = app.configure(settings.port, settings.clientId, settings.clientSecret, config, onInstallation);
 


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears('hello', 'direct_message', function (bot, message) {
    bot.reply(message, 'Hello!');
});


/*** */
async function enqueue(term){
    var searchResult = await search(term);
    if (!searchResult) return; // no file
    var filename = await youtubeDl(searchResult.id);
    searchResult.filename = filename;
    playQueue.push(searchResult);
    await play();
}

async function play(){
    if (playing) return;
    if (!playQueue.length) return;

    var item = playQueue.pop();

    await player(item.filename);
    
    playing = false;
    setImmediate(play);
}
