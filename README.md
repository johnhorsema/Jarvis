This is a NodeJS scraper with basic functionality.
Stemmer used [porter-stemmer](https://github.com/jedp/porter-stemmer).
Index data stored in hashtable using [LevelDB](https://github.com/Level/levelup).

Implemented
- Extract words
- Extract links
- Remove stopwords
- Stemming words
- Front-end (input box)
- Generate Freq Table

TODO
- Define index structure
- Save index into database

Diary
- Followed this [tutorial](https://scotch.io/tutorials/scraping-the-web-with-node-js)
- Followed this [guide](https://blog.yld.io/2016/10/24/node-js-databases-an-embedded-database-using-leveldb/#.WLbx6GR94y4) for using LevelDB