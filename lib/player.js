var childProcess = require('child_process');

var process;

module.exports = async function(filename){
    return new Promise((resolve, reject) => {
        console.log(`playing ${filename}`);
        process = childProcess.spawn("mpg123", [filename]);
        process.on("close", () => {
            process = null;
            resolve();
        });
    });
}

module.exports.skip = () => {
    if (process) process.kill('SIGINT');
}