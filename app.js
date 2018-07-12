var youtubeDl = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');
var app = require('./lib/apps');
var settings = require('./client_secret.json');

var playQueue = [];
var playing = false;
var downloads = {};

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
    thisBot = bot;
    console.log('CONNECTED');
    //getChannels(bot);
});
var fullChannelList = [];

function getChannels(bot){
    bot.api.channels.list({}, function (err, response) {
        fullChannelList = [];
        if (response.hasOwnProperty('channels') && response.ok) {
            var total = response.channels.length;
            for (var i = 0; i < total; i++) {
                var channel = response.channels[i];
                if (channel.name === "random") continue;
                fullChannelList.push({name: channel.name, id: channel.id});
            }
        }
        console.log("got channel list");
        console.log(fullChannelList);
    });
}

var thisBot;

/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I HAVE ARRIVED!")
});

controller.hears('hello', ['direct_message', 'ambient'], function (bot, message) {
    bot.reply(message, 'Hello!');
});

controller.hears('skip', ['direct_message', 'ambient'], function (bot, message) {
    player.skip();
    bot.reply(message, ':fast_forward: Skipping');
});

controller.hears(['pause', 'resume'], ['direct_message', 'ambient'], function (bot, message) {
    player.pauseResume();
    bot.reply(message, ':back_right_pointing_triangle_with_double_vertical_bar: pause / resuming');
});

controller.hears(['rewind'], ['direct_message', 'ambient'], function (bot, message) {
    player.rewind();
    bot.reply(message, ':rewind: WHO WANTS THE REWIND?');
});

controller.hears(["current", "playing", "what"], ['direct_message', 'ambient'],function (bot, message) {
    if (null == currentlyPlaying) return bot.reply(message, "There is nothing playing at the moment");
    bot.reply(message, `:musical_note: Currently playing ${currentlyPlaying.title}\n${currentlyPlaying.thumbnails.medium.url}`);
});

controller.hears(["queue", "list"], ['direct_message', 'ambient'],function (bot, message) {
    var allTracks = [];
    playQueue.forEach(x => allTracks.push(`:musical_note: ${x.title}`));
    Object.keys(downloads).map(x => downloads[x]).forEach(x => allTracks.push(`:floppy_disk: ${x.title}`))
    if (!allTracks.length) return bot.reply(message, "There is nothing in the queue");
    bot.reply(message, `Currently queued:\n ${allTracks.join("\n")}`);
});

controller.hears("^play .*", ['direct_message', 'ambient'], function(bot, message){
    thisBot = bot;
    var searchString = message.text.toLowerCase().replace('play ', '');
    search(searchString).then(result => {
        if (!result){
            return bot.reply(message, `Sorry, I couldn't find anything`);
        }

        bot.reply(message, `:floppy_disk: Downloading ${result.title}`);

        downloads[result.id] = result;
        
        console.log(`downloading ${result.title} ${result.id}`);
        youtubeDl(result.id).then(filename => {
            bot.reply(message, `:heavy_check_mark: Download complete, queueing ${result.title} (${playQueue.length} items in the queue)`);
            console.log(`download complete ${result.title} ${filename}`);
            result.filename = filename;
            delete downloads[result.id];
            playQueue.push(result);
            play().then(() => {});
        }).catch(() => {
            delete downloads[result.id];
            bot.reply(message, `Error, unable to download ${result.title}`);
        });
    });
});


controller.hears("help", ['direct_message', 'ambient'],function (bot, message) {
    var textLine = ["Hi! :waves: Type the following into this chat to control the music",
        "`play XXX` to play a tune",
        "`current` to find out what is currently playing",
        "`list` to list the tunes queued up",
        "`skip` to move onto the next tune",
        "`rewind` to rewind to the start of the current tune",
        "`pause` / `resume` to pause the music"
    ];    
    bot.reply(message, text.join("\n"));
});


var currentlyPlaying = null;

async function play(){
    if (playing) return;
    if (!playQueue.length) return;

    var item = playQueue.shift();

    playing = true;

    currentlyPlaying = item;
    try{
        fullChannelList.forEach(channel => {
            thisBot.say({
                text:`:musical_note: playing ${item.title}\n${item.thumbnails.medium.url}`,
                channel:channel.id
            });
        });
    } catch (e){
        console.log("error announcing next item");
        console.log(e);
    }
    
    console.log(`start playing ${item.title} ${item.filename}`);
    await player.play(item.filename);
    console.log(`finished playing ${item.title} ${item.filename}`);
    currentlyPlaying = null;
    
    playing = false;
    setImmediate(play);
}
