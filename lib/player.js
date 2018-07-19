var childProcess = require('child_process');

var process;
var currentFile;

module.exports.play = async function(filename){
    currentFile = filename;
    return new Promise((resolve, reject) => {
        process = childProcess.spawn("mpg123", [filename, "--control"]);
        process.on("close", () => {
            process = null;
            currentFile = null;
            resolve();
        });
    });
}

module.exports.skip = () => {
    if (process) process.kill('SIGINT');
}

module.exports.pauseResume = () => {
    if (process) process.stdin.write('s');
}

module.exports.rewind = () => {
    if (currentFile && process){
        process.kill('SIGINT');
        process = childProcess.spawn("mpg123", [currentFile, "--control"]);
    }
}