var youtubeDl = require('./lib/youtubedl');
var player = require('./lib/player');

var playQueue = [];
var playing = false;

async function enqueue(fileId){
    var filename = await youtubeDl(fileId);
    playQueue.push({filename : filename});
    play();
}

function play(){
    if (playing) return;
    if (!playQueue.length) return;

    var item = playQueue.pop();

    player(item.filename, () => {
        playing = false;
        setImmediate(play);
    });
}
