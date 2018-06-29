var childProcess = require('child_process');

var process;

module.exports = async function(filename){
    return new Promise((resolve, reject) => {
        console.log(`playing ${filename}`);
        process = childProcess.exec(`mpg123 "${filename}"`, resolve);
    });
}

module.exports.skip = () => {
    if (process) process.kill();
}