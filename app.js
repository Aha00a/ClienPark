const { exec } = require('child_process');
const url = require('url');
const fs = require('fs');
const os = require('os');
const fetch = require('node-fetch');

class FsAsync {
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
}

class Cache {
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
}

function execute(s) {
    console.log(`exec\t${s}`);
    exec(s);
}

function launchBrowser(v) {
    return true;
    switch (os.platform()) {
        case 'win32':
            execute(`start "" "${v}"`);
            return true;
        case 'darwin':
            execute(`open "${v}"`);
            return true;
    }
    return true;
}

async function getClienArticles(page) {
    const url = `https://clien.net/service/board/park?&od=T33&po=${page}`;
    console.log(`crawl\t${url}`);
    const text = await fetch(url).then(r => r.text());
    return text
        .match(new RegExp('(?<=href=")/service/board/park/(\\d+)[^"]+', 'g'))
        .filter(v => !v.endsWith("#comment-point"))
        .map(v => `https://clien.net${v}`);
}

async function parseClienListAndLaunchArticlesWithPage(page, cache) {
    try {
        const articles = await getClienArticles(page);
        return articles.map(v => {
            const path = url.parse(v).pathname.split('/');
            const id = path[path.length - 1];
            if(cache.exists(id))
                return false;

            cache.put(id);
            return launchBrowser(v);
        });
    } catch (e) {
        console.log(e);
        return [];
    }
}

(async () => {
    const cache = new Cache();
    await cache.load();
    for(let i = 0; i < 100; i++) {
        const arrayResult = await parseClienListAndLaunchArticlesWithPage(i, cache);
        if(arrayResult.some(v => v))
            break;
    }
    await cache.save();
})();
