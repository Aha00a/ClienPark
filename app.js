const url = require('url');
const fetch = require('node-fetch');
const Cache = require('./modules/utils/Cache');
const WebBrowserLauncher = require('./modules/utils/WebBrowserLauncher');

async function getClienArticlesWithPage(page) {
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
        const articles = await getClienArticlesWithPage(page);
        return articles.map(v => {
            const path = url.parse(v).pathname.split('/');
            const id = path[path.length - 1];
            if(cache.exists(id))
                return false;

            const launch = WebBrowserLauncher.launch(v);
            if(launch)
                cache.put(id);

            return launch;
        });
    } catch (e) {
        console.log(e);
        return [];
    }
}

(async () => {
    if(!WebBrowserLauncher.isSupportedPlatform()) {
        console.log('Not supported platform');
        return;
    }

    const cache = new Cache();
    await cache.load();
    for(let i = 0; i < 100; i++) {
        const arrayResult = await parseClienListAndLaunchArticlesWithPage(i, cache);
        if(arrayResult.some(v => v))
            break;
    }
    await cache.save();
})();
