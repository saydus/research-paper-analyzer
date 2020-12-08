# Research Paper Analyzer
A script to scrape and analyze the popularity and citations of recent research papers from [Cambridge University Press](https://www.cambridge.org/core/journals/american-political-science-review/most-cited).
--
Built for Media and Inequality Lab at Vanderbilt University.

---
### To run:
1. `npm i`
2. `node scraper`

--- 
The scraper uses [puppeteer](https://developers.google.com/web/tools/puppeteer) (headless browser framework) because citation data and Altmetric links load after JavaScript executes on the page (+ AJAX only pagination). 


The script retrieves the following information (in `.csv` format) about publications in the last 3 years:

| Title |	Cambridge link |	Link to Altmetric |	Date of online publication |	Attention Score |	Number of tweets |	Number of users tweeted |	Upper bound of followers | 	Number of citations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

`analysis.Rmd` also includes visualization of the relationship. 
