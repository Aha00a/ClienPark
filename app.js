const url = require('url');
const fetch = require('node-fetch');
const Cache = require('./modules/utils/Cache');
const WebBrowserLauncher = require('./modules/utils/WebBrowserLauncher');

class Clien {
    constructor() {
        this.page = 0;
        this.array = [];
    }

    async get() {
        if(this.array.length === 0)
            this.array = await Clien.getClienArticlesWithPage(this.page++);

        return this.array.shift();
    }

    static async getClienArticlesWithPage(page, {cookie} = {}) {
        const url = `https://clien.net/service/board/park?&od=T33&po=${page}`;
        console.log(`crawl\t${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Cookie: cookie
            }
        });
        const text = await response.text();
        const match = text.match(/document.cookie="(\w+=\w+)"/);
        if(match){
            return this.getClienArticlesWithPage(page, {cookie: match[1]})
        }
        return text
            .match(new RegExp('(?<=href=")/service/board/park/(\\d+)[^"]+', 'g'))
            .filter(v => !v.endsWith("#comment-point"))
            .map(v => `https://clien.net${v}`);
    }

    static getClienId(articleUrl) {
        const path = url.parse(articleUrl).pathname.split('/');
        return path[path.length - 1];
    }
}

(async () => {
    try {
        if (!WebBrowserLauncher.isSupportedPlatform()) {
            console.log('Not supported platform');
            return;
        }

        // noinspection JSUnusedLocalSymbols
        const [version ,major, minor, patch] = process.version.match(/v(\d+)\.(\d+)\.(\d+)/).map(v => parseInt(v));
        if(!major || major < 10) {
            console.error("Requires node version 10 or higher");
            return;
        }

        const cache = new Cache();
        await cache.load();
        {
            const max = parseInt(process.argv[2]) || 10;
            let opened = 0;

            const clien = new Clien();
            while(opened < max) {
                const articleUrl = await clien.get();
                const id = Clien.getClienId(articleUrl);
                if (cache.exists(id))
                    continue;

                WebBrowserLauncher.launch(articleUrl);
                cache.put(id);
                opened++;
            }
        }
        await cache.save();
    } catch (e) {
        console.log(e);
    }
})();
