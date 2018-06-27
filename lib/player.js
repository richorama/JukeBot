var childProcess = require('child_process');

module.exports = async function(filename){
    return new Promise((resolve, reject) => {
        childProcess.exec(`mpg123 "${filename}"`, resolve);
    });
}