# Research Paper Analyzer
A script to scrape and analyze the popularity and citations of recent research papers from [Cambridge University Press](https://www.cambridge.org/core/journals/american-political-science-review/most-cited).
--
Built for Media and Inequality Lab at Vanderbilt University.

---
To run:
1. `npm i`
2. `node scraper`

The scraper uses [puppeteer](https://developers.google.com/web/tools/puppeteer) (headless browser framework) because citation data and Altmetric links load after JavaScript executes on the page (+ AJAX only pagination). 
