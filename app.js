const youtubeDl = require('./lib/youtubedl');
const search = require('./lib/youtubeSearch');
const player = require('./lib/player');
const app = require('./lib/apps');
const settings = require('./client_secret.json');
const stato = require('./lib/stato');

var playQueue = [];
var playing = false;
var downloads = {};

if (process.argv.indexOf('register') >= 0){
    const localtunnel = require('localtunnel');
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

const controller = app.configure(settings.port, settings.clientId, settings.clientSecret, config, onInstallation);

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
    getChannels(bot);
});
var fullChannelList = [];

function getChannels(bot){
    bot.api.channels.list({}, function (err, response) {
        fullChannelList = [];
        if (response.hasOwnProperty('channels') && response.ok) {
            var total = response.channels.length;
            for (var i = 0; i < total; i++) {
                // only consider channels in the config file
                var channel = response.channels[i];
                if (!settings[channel.name]) continue;
                console.log(`using ${channel.name} channel for announcements`);
                fullChannelList.push({name: channel.name, id: channel.id});
            }
        }
    });
}

var thisBot;
var userCache = {};
/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

function getUsername(bot, userId, cb){
    if (userCache[userId]) return cb(userCache[userId]);
    bot.api.users.info({user:userId},function(err,response) {
        if (err) return cb("");
        var name = response.user.real_name || response.user.name;
        userCache[userId] = name;
        cb(name)
    });
}


controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I HAVE ARRIVED!")
});

controller.hears('hello', ['direct_message', 'ambient'], function (bot, message) {
    getUsername(bot, message.user, name => {
        bot.reply(message, `Hello ${name}!`);
    })
    
});

controller.hears('skip', ['direct_message', 'ambient'], function (bot, message) {

    if (currentlyPlaying){
        var recordSkipForThisTrack = currentlyPlaying;
        getUsername(bot, message.user, name => {
            recordSkipForThisTrack.skipped_by = name;
            stato.recordSkip(recordSkipForThisTrack)
        });
    }

    player.skip();

    bot.reply(message, ':fast_forward: Skipping');
});

controller.hears(['pause', 'resume'], ['direct_message', 'ambient'], function (bot, message) {
    player.pauseResume();
    bot.reply(message, ':black_right_pointing_triangle_with_double_vertical_bar: pause / resuming');
});

controller.hears(['rewind'], ['direct_message', 'ambient'], function (bot, message) {
    player.rewind();
    bot.reply(message, ':rewind: WHO WANTS THE REWIND?');
});

controller.hears(["current", "playing", "what"], ['direct_message', 'ambient'],function (bot, message) {
    if (null == currentlyPlaying) return bot.reply(message, "There is nothing playing at the moment");
    bot.reply(message, `:musical_note: Currently playing ${currentlyPlaying.title} as requested by ${currentlyPlaying.requested_by}\n${currentlyPlaying.thumbnails.medium.url}`);
});

controller.hears(["queue", "list"], ['direct_message', 'ambient'],function (bot, message) {
    var allTracks = [];
    playQueue.forEach(x => allTracks.push(`:musical_note: ${x.title}  (${x.requested_by})`));
    Object.keys(downloads).map(x => downloads[x]).forEach(x => allTracks.push(`:floppy_disk: ${x.title} (${x.requested_by})`))
    if (!allTracks.length) return bot.reply(message, "There is nothing in the queue");
    bot.reply(message, `Currently queued:\n${allTracks.join("\n")}`);
});

controller.hears("^play .*", ['direct_message', 'ambient'], function(bot, message){
    thisBot = bot;
    const searchString = message.text.toLowerCase().replace('play ', '');
    search(searchString).then(results => {
        const result = results[0];
        if (!result){
            return bot.reply(message, `Sorry, I couldn't find anything`);
        }

        getUsername(bot, message.user, name => {

            result.requested_by = name;

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
});


controller.hears("^search .*", ['direct_message', 'ambient'], function(bot, message){
    thisBot = bot;
    var searchString = message.text.toLowerCase().replace('search ', '');
    search(searchString).then(results => {
        bot.reply(message, `here is what I found:\n ${results.map((x, index) => `${index + 1}. ${x.title}`).join('\n')}`);

    }).catch(() => {
        bot.reply(message, `Error, unable to search for ${searchString}`);
    });

});

controller.hears("help", ['direct_message', 'ambient'],function (bot, message) {
    var text = ["Hi! :wave: Type the following into this chat to control the music",
        "`play Rick Astley` to play a tune",
        "`current` to find out what is currently playing",
        "`list` to list the tunes queued up",
        "`skip` to move onto the next tune",
        "`rewind` to rewind to the start of the current tune",
        "`pause` / `resume` to pause the music",
        "`search Rick Astley` shows the top results for your search term"
    ];    
    bot.reply(message, text.join("\n"));
});


controller.hears("stats", ['direct_message', 'ambient'],function (bot, message) {
    var summary = stato.getSummary();
    bot.reply(message, summary);
});


var currentlyPlaying = null;

async function play(){
    if (playing) return;
    if (!playQueue.length) return;

    var item = playQueue.shift();

    playing = true;

    stato.recordPlay(item);

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
