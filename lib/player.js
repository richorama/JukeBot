var childProcess = require('child_process');

var process;

module.exports.play = async function(filename){
    return new Promise((resolve, reject) => {
        process = childProcess.spawn("mpg123", [filename, "--control"]);
        process.on("close", () => {
            process = null;
            resolve();
        });
    });
}

module.exports.skip = () => {
    if (process) process.kill('SIGINT');
}

module.exports.pauseResume = () => {
    if (process) process.write('s');
}

module.exports.rewind = () => {
    if (process) process.write(',');
}