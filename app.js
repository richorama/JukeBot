var youtubeDl = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');
var app = require('./lib/apps');
var settings = require('./client_secret.json');

var playQueue = [];
var playing = false;

if (process.argv.indexOf('register') >= 0){
    var localtunnel = require('localtunnel');
    localtunnel(parseInt(settings.port), { subdomain:settings.subdomain }, (err,tunnel) => {
        if (err) return console.log("error", err);
        console.log(`visit ${tunnel.url}/login to register this bot`);
        tunnel.on("close", () => console.log("TUNNEL CLOSED") );
        tunnel.on("error", err => console.log("TUNNEL ERROR", err) );
    });
}

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

controller.hears("^play .*", 'direct_message', function(bot, message){
    var searchString = message.text.toLowerCase().replace('play ', '');
    search(searchString).then(result => {
        if (!result){
            return bot.reply(message, `Sorry, I couldn't find anything`);
        }

        bot.reply(message, `Queuing ${result.title}`);

        youtubeDl(result.id).then(filename => {
            console.log(`downloaded ${result.title} ${filename}`);
            result.filename = filename;
            playQueue.push(result);
            play().then(() => {});
        });
    });
});

/*
async function enqueue(term){
    var searchResult = await search(term);
    if (!searchResult) return; // no file
    var filename = await youtubeDl(searchResult.id);
    searchResult.filename = filename;
    playQueue.push(searchResult);
    await play();
}
*/
async function play(){
    if (playing) return;
    if (!playQueue.length) return;

    var item = playQueue.pop();

    await player(item.filename);
    
    playing = false;
    setImmediate(play);
}
