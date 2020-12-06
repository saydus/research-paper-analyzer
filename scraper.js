const puppeteer = require('puppeteer')
const fs = require('fs');
const { Console } = require('console');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: 'papers.csv',
  header: [
    {id: 'title', title: 'Title'},
    {id: 'link', title: 'Cambridge link'},
    {id: 'analytics_link', title: 'Link to Altmetric'},
    {id: 'date', title: 'Date of online publication'},
    {id: 'attention', title: 'Attention Score'},
    {id: 'tweets', title: 'Number of tweets'},
    {id: 'users', title: 'Number of users tweeted'},
    {id: 'upper_bound', title: 'Upper bound of followers'},
    {id: 'citations_num', title: 'Number of citations'}
  ]
});


let papers = [];
let numPages = 10;

async function getData() {
    try {
        // Load the headless browser adn the first page
        const browser = await puppeteer.launch();
        let page = await browser.newPage();

        await page.goto(`https://www.cambridge.org/core/journals/american-political-science-review/most-cited`)
        page.waitForSelector("div.altmetric-embed > a")

        // click  on Last 3 years
        console.log("Clicking the last 3 years button")
        const lastYearsButton = await page.$(".sort-content  .checkbox[data-agg-container='Last 3 years'] .styled");
        await lastYearsButton.evaluate(lastYearsButton => lastYearsButton.click());
        await page.waitForNavigation();
        await page.waitForTimeout(2000);
        console.log("Clicked it")
        
        // Iterate through the last 3 years
        for (let i = 1; i <= numPages; ++i){
            console.log("Analayzing page " + i)

            let papersInfo = await page.evaluate(() => {
                let paperTitle = document.querySelectorAll(".part-link")
                let paperDate = document.querySelectorAll(".published .date")
                let analytics_link = document.querySelectorAll(".altmetric-embed.medium-1 > a")
                let citations_num = document.querySelectorAll(".listing-citation-modal > .number") 
                let paperInfoArray = []

                for (let i = 0; i < analytics_link.length; i++) {
                    paperInfoArray[i] = {
                        title: paperTitle[i].innerText.trim(),
                        date : paperDate[i].innerText.trim(),
                        link: "https://www.cambridge.org" + paperTitle[i].getAttribute("href"),
                        analytics_link: "https://cambridge.altmetric.com/details/" + analytics_link[i].getAttribute("href").substr(75) + "/twitter",
                        citations_num: citations_num[i].innerText.trim()
                    };
                }
                return paperInfoArray;
            });

            // Extend the papers object
            papers = papers.concat(papersInfo); 

            console.log(`Got data from page ${i}. There were ${papersInfo.length} elements found on that page.`);

            // Click on next page
            let nextPageButton = await page.$(".pagination > .current + li a");
            if (nextPageButton){
                await nextPageButton.evaluate(nextPageButton => nextPageButton.click());
                await page.waitForNavigation();
                await page.waitForTimeout(2000);
            }
        }
        
        console.log(`Now getting twitter data for ${papers.length} papers`);
        // Get analytics data
        for (let j = 0; j < papers.length; ++j) {
            let paper = papers[j];
            console.log(`Getting popularity data for paper ${j + 1}`);
            let url = paper.analytics_link;
            let analytics_page = await browser.newPage();
            await analytics_page.goto(url);
            analytics_page.waitForSelector(".section-summary > .text strong");

            [paper.attention, paper.tweets, paper.users, paper.upper_bound] = await analytics_page.evaluate(() => {
                // Get twitter values
                let twitter_data = document.querySelectorAll(".section-summary > .text strong");
                
                // Get attention score
                let attention_url = document.querySelector(".altmetric-badge-wrapper > .altmetric-badge").style["background-image"];
                let beginIndex = attention_url.indexOf("score=") + 6;
                let endIndex = attention_url.indexOf("&", beginIndex);
                let attention_score = attention_url.substr(beginIndex, endIndex - beginIndex);

                // Return Twitter data
                if (twitter_data.length == 3){ 
                    return [parseInt(attention_score), twitter_data[0].innerText, twitter_data[1].innerText, twitter_data[2].innerText]
                }
                else if (twitter_data.length == 2){
                    return [parseInt(attention_score), twitter_data[0].innerText, 1, twitter_data[1].innerText]
                }
                else {
                    return [parseInt(attention_score), 0, 0, 0];
                }
            }); 
        }
        await browser.close()
    } catch (error) {
        console.error(error)
    }
}

getData().then(() => {
    csvWriter
    .writeRecords(papers)
    .then(()=> console.log('The CSV file was written successfully'));
}).catch(err => console.error(err))