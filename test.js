var yt = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var player = require('./lib/player');
var fs = require('fs');

const filename = 'qBNmY7S0BG8.mp3';

describe('youtube dl', () => {
    
    if (fs.existsSync(filename)) fs.unlinkSync(filename);

    it('saves video as an audio file', done => {

        yt('qBNmY7S0BG8').then(x => {

            if (x !== filename) return done("expecting mp3 file")
            if (!fs.existsSync(filename)) return done("expecting file to be written");
            done();            
            
            //if (fs.existsSync(filename)) fs.unlinkSync(filename);

        }).catch(err => {
            done(err);
        });

    }).timeout(10000);
});

describe('player', () => {
    it ('plays an audio file', done => {

        player.play(filename).then(done);

    });
});

describe('youtube search', () => {

    it('searches youtube', done => {
        search("daft punk").then(x => {
            if (0 === x.length) return done("no results")
            if (!x[0].id ) return done("no id")
            done();
        });
    });

});
