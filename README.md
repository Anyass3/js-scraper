# headless-chrome
Puppeteerjs
# scraper for javascript sites

> hosted: [https://nscrape.herokuapp.com]

## how to use
- for example to scrape google

    - https://nscrape.herokuapp.com?url=www.google.com

- to take screenshot

    - https://nscrape.herokuapp.com?url=www.google.com&res=screenshot

- other query augument is `waitUntil`:
    - options: `load`| `domcontentloaded` | `networkidle0` | `networkidle2`

    - example: 
    
        - https://nscrape.herokuapp.com?url=www.google.com&res=screenshot&waitUntil=networkidle0



### To run on heroku
add buildpacks
- [https://github.com/jontewks/puppeteer-heroku-buildpack]
- heroku/nodejs# js-scraper
