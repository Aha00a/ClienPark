const FsAsync = require('./FsAsync');

module.exports = class Cache {
    static cacheFile() {
        return 'cache.txt';
    }

    async load() {
        const text = await FsAsync.readFileCatches(Cache.cacheFile(), 'utf8');
        this.lines = text.split('\n')
    }

    exists(k) {
        return this.lines.includes(k);
    }

    put(k) {
        this.lines.push(k);
    }

    async save() {
        await FsAsync.writeFile(Cache.cacheFile(), this.lines.slice(-1000).join('\n'), 'utf8');
    }
};
