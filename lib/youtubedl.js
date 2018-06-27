const process = require('child_process');
const fs = require('fs');

function getFile(fileId, cb){
    fs.readdir(`./`, (err, files) => {
        if (err) return cb(err);
        let file = files.filter(f => f.startsWith(`${fileId}.`))[0];
        if (file) return cb(null, file);
        return cb(); // nothing found
    });
}

function download(fileId, cb){
    process.exec(`youtube-dl -x --id "${fileId}" --audio-format mp3 --audio-quality 0`, (err) => {
        if (err) return cb(err);
        cb();
    });
}

module.exports = async function(fileId){
    return new Promise((resolve, reject) => {
        getFile(fileId, (err, file) => {
            if (err) return reject(err);
            if (file) return resolve(file);
            download(fileId, (err) => {
                if (err) return reject(err);
                getFile(fileId, (err, file) => {
                    if (err) return reject(err);
                    if (!file) return reject("could not get file");
                    return resolve(file);
                });
            });

        });
    });
}