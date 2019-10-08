const fs = require('fs');

module.exports = class FsAsync {
    static readFile(path, options) {
        return new Promise((resolve, reject) =>{
            fs.readFile(path, options, (err, data) => {
                if (err)
                    return reject(err);

                resolve(data);
            });
        });
    }
    static async readFileCatches(path, options) {
        try {
            return await FsAsync.readFile(path, options);
        } catch(err) {
            return '';
        }
    }

    static writeFile(path, data, options) {
        return new Promise((resolve, reject) =>{
            fs.writeFile(path, data, options, (err) => {
                if (err)
                    return reject(err);

                return resolve();
            });
        });
    };
};
