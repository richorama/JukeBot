const process = require('child_process');
const fs = require('glob-fs')();

function getFile(fileId, cb){
    fs.readdir(`${fileId}.*`, (err, files) => {
        if (err) return cb(err);
        if (files.length) return cb(null, files[0]);
        return cb(); // nothing found
    });
}

function download(fileId, cb){
    process.exec(`youtube-dl -x --id "${fileId}"`, (err) => {
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