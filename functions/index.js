const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});
const puppeteer = require('puppeteer');

const scrapeImages = async (username) => {
    const browser = await puppeteer.launch( { headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.instagram.com/accounts/login/');
    // Login form
    await page.screenshot({path: 'images/1.png'});
    await page.type('[name=username]', 'username');
    await page.type('[name=password]', '$$some-password$$');
    await page.screenshot({path: 'images/2.png'});
    await page.click('[type=submit]');

    // Social Page

    await page.waitFor(5000);
    await page.goto(`https://www.instagram.com/${username}`);
    await page.waitForSelector('img ', {
        visible: true,
    });
    await page.screenshot({path: 'images/3.png'});
    // Execute code in the DOM
    const data = await page.evaluate( () => {

        const images = document.querySelectorAll('img');

        const urls = Array.from(images).map(v => v.src);

        return urls
    });
    await browser.close();
    console.log(data);
    return data;
}

exports.scraper = functions.https.onRequest( async (request, response) => {
    cors(request, response, async () => {


        const body = JSON.parse(request.body);
        const data = await scrapeImages(body.text);

        response.send(data)

    });
});