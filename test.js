var yt = require('./lib/youtubedl');
var search = require('./lib/youtubeSearch');
var fs = require('fs');

describe('youtube dl', () => {
    
    const filename = 'qBNmY7S0BG8.m4a';
    if (fs.existsSync(filename)) fs.unlinkSync(filename);

    it('saves video as an audio file', done => {

        yt('qBNmY7S0BG8').then(x => {

            if (x !== filename) return done("expecting m4a file")
            if (!fs.existsSync(filename)) return done("expecting file to be written");
            done();            
            
            if (fs.existsSync(filename)) fs.unlinkSync(filename);

        }).catch(err => {
            done(err);
        });

    }).timeout(10000);
});

describe('youtube search', () => {

    it('searches youtube', done => {
        search("rocket guns blazin").then(x => {
            if (!x) return done("no results")
            if (!x.id ) return done("no id")
            done();
        });
    });

});