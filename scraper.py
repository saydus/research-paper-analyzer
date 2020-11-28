import requests
from bs4 import BeautifulSoup

list_page = requests.get("https://www.cambridge.org/core/journals/american-political-science-review/latest-issue?sort=canonical.position%3Aasc&aggs%5BproductDate%5D%5Bfilters%5D=Last%203%20years&searchWithinIds=6C7C5845F1C84D63F7BDDC2B28AC8612&productType=JOURNAL_ARTICLE&template=cambridge-core%2Fjournal%2Farticle-listings%2Flistings-wrapper&hideArticleJournalMetaData=true&displayNasaAds=false")

list_src = list_page.content
list_soup = BeautifulSoup(list_src, 'lxml')

print(list_soup.prettify())

divs = list_soup.find_all("div", {"class": "altmetric-embed"})
links_to_papers = []

for i in divs:
    links_to_papers.append(i.find("a"))

print(divs)