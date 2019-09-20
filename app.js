
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const url = require('url');
const fs = require('fs');
const os = require('os');


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
        return this.lines.indexOf(k) >= 0;
    }

    put(k) {
        this.lines.push(k);
    }
    
    async save() {
        await FsAsync.writeFile(Cache.cacheFile(), this.lines.slice(-1000).join('\n'), 'utf8');
    }
}

function checkCacheAndLaunch(cache, v) {
    const path = url.parse(v).pathname.split('/');
    const id = path[path.length - 1];
    if(cache.exists(id))
        return false;

    console.log(`open\t${v}`);
    cache.put(id);
    switch(os.platform()){
        case 'win32':
            exec(`"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" "${v}"`);
            return true;
        case 'darwin':
            console.log('OSX!');
            return true;
    }
    return true;
}

async function extractClienHref(browser, url, cache) {
    console.log(`extractClienHref\t${url}`);
    const page = await browser.newPage();
    await page.goto(url);
    const array = await page.$$eval('a.list_subject', a => [].map.call(a, a => a.href));
    return array
        .filter(s => s.startsWith('https://www.clien.net/service/board/park/'))
        .map((v, i) => checkCacheAndLaunch(cache, v));
}


(async () => {
    const cache = new Cache();
    const [, browser] = await Promise.all([
        cache.load(),
        puppeteer.launch(),
    ]);

    for(let i = 0; i < 100; i++) {
        const arrayResult = await extractClienHref(browser, `https://www.clien.net/service/board/park?&od=T33&po=${i}`, cache);
        if(arrayResult.some(v => v))
            break;
    }
    console.log('Done');
    await Promise.all([
        browser.close(),
        cache.save()
    ])
})();
