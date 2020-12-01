const puppeteer = require('puppeteer')
const fs = require('fs');
const { Console } = require('console');
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
    {id: 'upper_bound', title: 'Upper bound of followers'}
  ]
});

let numPagesToAnalyze = 9
papers = []

async function getData() {
    try {
        console.log("Number of pages: " + numPagesToAnalyze)

        for (let i = 1; i <= numPagesToAnalyze; ++i){
            let page = await browser.newPage();
            await page.goto(`https://www.cambridge.org/core/journals/american-political-science-review/most-cited?pageNum=${i}`)
            page.waitForSelector("div.altmetric-embed > a")

            console.log("Analayzing page " + i);

            let papersInfo = await page.evaluate(() => {
                let paperTitle = document.querySelectorAll(".part-link")
                let paperDate = document.querySelectorAll(".published .date")
                let analytics_link = document.querySelectorAll(".altmetric-embed.medium-1 > a")
                let paperInfoArray = []
                // let offset_for_date = paperDate.length / 2;
                for (let i = 0; i < analytics_link.length; i++) {
                    paperInfoArray[i] = {
                        title: paperTitle[i].innerText.trim(),
                        date : paperDate[i].innerText.trim(),
                        link: "https://www.cambridge.org" + paperTitle[i].getAttribute("href"),
                        analytics_link: "https://cambridge.altmetric.com/details/" + analytics_link[i].getAttribute("href").substr(75) + "/twitter" 
                    };
                }
                return paperInfoArray;
            });
            papers = papers.concat(papersInfo); 
            console.log("Got data from page " + i) 
        }

        console.log("Now getting twitter data for pages");

        // Get analytics data
        for(let j = 0; j < papers.length; ++j) {
            console.log("Getting popularity data for paper " + j);
            paper = papers[j];
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

                return [parseInt(attention_score), twitter_data[0].innerText, twitter_data[1].innerText, twitter_data[2].innerText]
            })
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
})
.catch(err => console.error(err))

