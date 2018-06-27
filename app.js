var youtubeDl = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');

var playQueue = [];
var playing = false;

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
