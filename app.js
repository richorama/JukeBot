var youtubeDl = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');
var localtunnel = require('localtunnel');

var playQueue = [];
var playing = false;


var settings = require('./client_secret.json');
if (settings.subdomain){
    localtunnel(8080, { subdomain:settings.subdomain }, (err,tunnel) => {
        if (err) return console.log("error", err);
        console.log(tunnel);
        tunnel.on("close", () => console.log("TUNNEL CLOSED") );
        tunnel.on("error", err => console.log("TUNNEL ERROR", err) );
    });
}

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
