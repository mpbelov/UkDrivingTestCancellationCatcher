const puppeteer = require("puppeteer");

const profile = {
    url: "https://driverpracticaltest.dvsa.gov.uk/login",
    licenceNumber: "CHANGE_ME",
    referenceNumber: "CHANGE_ME",
    postCode: "CHANGE_ME",
    testDate: new Date("2021-09-27"),
};

const browserURL = "http://127.0.0.1:21222";

const timeout = async (milliseconds = 2000) => await new Promise(resolve => setTimeout(resolve, milliseconds));

(async () => {
    const waitForText = async (text, retries = 10) => {
        let retriesLeft = retries;
        while (retriesLeft > 0) {
            try {
                await page.waitForFunction(
                    t => document.querySelector("body").innerText.includes(t),
                    {},
                    text
                );
                break;
            } catch {
                retriesLeft--;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        if (retriesLeft <= 0) {
            const message = `The text "${text}" was not found on the page`;
            console.log(message);
            throw message;
        }
    };

    const login = async (browserClient) => {
        const page = await browserClient.newPage();
        await page.goto(profile.url);

        await waitForText(page, "Enter details below to access your booking");
        console.log("Login page appeared");
        await page.type("#driving-licence-number", profile.licenceNumber, { delay: 20, });
        await page.type("#application-reference-number", profile.referenceNumber, { delay: 20 });
        await page.click("#booking-login");

        await waitForText(page, "View booking");
        console.log("Change test center appeared");
        await page.click("#test-centre-change");

        await waitForText(page, "Search by your home postcode or by test centre name");
        console.log("Input post code appeared");
        await page.$eval("#test-centres-input", el => (el.value = ""));
        await page.type("#test-centres-input", profile.postCode, { delay: 20 });
        await page.click("#test-centres-submit");

        return page;
    };

    const parseCenters = async () => {
        const centers = await page.evaluate(() => {
            const centers = Array.from(
                document.querySelectorAll("#search-results > ul.test-centre-results > li.clear")
            );

            return centers.map(c => {
                const res = {
                    name: c.querySelector("div.test-centre-details > span > h2").innerText,
                    dateString: c.querySelector("div.test-centre-details > span > h5").innerText.substring(3),
                    href: c.querySelector("a").href,
                };

                return res;
            });
        });

        return centers
            .map(c => {
                const res = { ...c };
                if (c.dateString.includes("available")) {
                    const match = /.+\s(?<day>\d*)\/(?<month>\d*)\/(?<year>\d*)/.exec(c.dateString);
                    res.date = new Date(`${match.groups.year}-${match.groups.month}-${match.groups.day}`);
                }
                return res;
            })
            .filter(c => !!c.date && c.date < profile.testDate)
            .sort((a, b) => a.date - b.date);
    };

    const browser = await puppeteer.connect({
        browserURL,
        defaultViewport: null,
        slowMo: 10,
    });

    const page = await login(browser);

    let centers = await parseCenters();
    centers.forEach(c => console.log(c));

    if (centers.length === 0) {
        for (let i = 0; i < 10; i++) {
            await waitForText(page, "Show more results");
            await timeout();

            centers = await parseCenters();
            centers.forEach(c => console.log(c));

            console.log("Results appeared. Querying more centers");
            await page.click("#fetch-more-centres");
        }
        await timeout();
    }

    if (centers.length != 0) {
        centers.forEach(c => console.log(c));
    } else {
        console.log("No suitable dates available");
    }

    // page.close();
})().catch(function (e) {
    console.log("Promise Rejected");
    console.log(e);
});
