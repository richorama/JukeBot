var childProcess = require('child_process');

module.exports = async function(filename){
    return new Promise((resolve, reject) => {
        console.log(`playing ${filename}`);
        childProcess.exec(`mpg123 "${filename}"`, resolve);
        console.log(`finished ${filename}`);
    });
}