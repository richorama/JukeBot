var yt = require('./lib/youtubedl');
var fs = require('fs');

describe('youtube dl', () => {
    
    const filename = 'qBNmY7S0BG8.m4a';
    if (fs.existsSync(filename)) fs.unlinkSync(filename);

    it('saves video as an audio file', done => {

        yt('qBNmY7S0BG8').then(x => {

            if (x !== filename) return done("expecting m4a file")
            if (!fs.existsSync(filename)) return done("expecting file to be written");
            done();            

        }).catch(err => {
            done("error", err);
        });

    }).timeout(10000);
});

