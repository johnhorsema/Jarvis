This is a NodeJS web crawler with basic functionality.
Stemmer used [porter-stemmer](https://github.com/jedp/porter-stemmer).
Index data stored in key-value storage using [LevelDB](https://github.com/Level/levelup).
Front visuals using Bootstrap.

## Getting Started
Install the npm packages.
```
npm install
```
Start the node server
```
npm start
```
To destroy the database
```
node cleardb
```

## Completed
- Extract words
- Extract links
- Remove stopwords
- Stemming words
- Front-end (input box)
- Generate Freq Table
- Defined index structure (mapping, foward, inverted, parent_child etc.)
- Save indexes into database
- Accept query and return tf*idf score

## TODO
- Generate tf*idf for all documents according to query

## Diary
- Followed this [tutorial](https://scotch.io/tutorials/scraping-the-web-with-node-js)
- Followed this [guide](https://blog.yld.io/2016/10/24/node-js-databases-an-embedded-database-using-leveldb/#.WLbx6GR94y4) for using LevelDB