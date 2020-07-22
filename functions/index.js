const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});
const puppeteer = require('puppeteer');
const request = require('request');
const fs = require('fs');
require('dotenv').config()

const autoScroll =  async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const downloadImage = (uri, filename, callback) =>  {
    request.head(uri, function (err, res, body) {
        request(uri)
            .pipe(fs.createWriteStream('images/'+filename))
            .on("close", callback);
    });

    return uri;
}

const scrapeImages = async (username) => {
    const browser = await puppeteer.launch( { headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.instagram.com/accounts/login/');

    // Login form
    await page.screenshot({path: 'images/login-page.png'});
    await page.waitForSelector('[name=username]');
    await page.type('[name=username]', process.env.uname);
    await page.waitForSelector('[name=password]');
    await page.type('[name=password]', process.env.password);
    await page.screenshot({path: 'images/login-page2.png.png'});
    await page.click('[type=submit]');

    // Social Page
    await page.waitFor(5000);
    await page.goto(`https://www.instagram.com/${username}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('img ', {
        visible: true,
    });
    await page.setViewport({
        width: 1200,
        height: 800
    });

    await autoScroll(page);

    await page.screenshot({
        path: 'images/fullpage.png',
        fullPage: true
    });

    const getData = async () => {
        // Execute code in the DOM
        const links = await page.evaluate( () => {
            const images = document.querySelectorAll('img');
            const urls = Array.from(images).map(v => v.src);

            return urls
        });

        return Promise.all(links.map( async link => {
            const page = await browser.newPage();
            const viewSource = await page.goto(link, { waitUntil: 'networkidle0' });
            await page.waitFor(1000);
            fs.writeFile('images/'+Math.floor(Date.now() / 1000)+Math.floor(Math.random() * 1000)+'.png', await viewSource.buffer(), (err) => {
                if(err) return console.log(err);
                console.log("The file was saved!");
            });

            return link;
        })).then((data) => {
            console.log(data);
            return data
        });
    }

    const returnLinks = getData().then(data => {
        browser.close();
        return data;
    })

    return returnLinks;
}

exports.scraper = functions.https.onRequest( async (request, response) => {
    cors(request, response, async () => {

        const body = JSON.parse(request.body);
        const data = await scrapeImages(body.text);

        response.send(data)

    });
});