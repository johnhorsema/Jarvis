var express = require('express');
var path = require('path');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var stemmer = require('porter-stemmer').stemmer;
var levelup = require('level');
var app     = express();

// Database Configuration

// Create our database, supply location and options.
// This will create or open the underlying LevelDB store.
var db = levelup('./mydb')
console.log('Database created at /mydb.');

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/scrape', function(req, res){
	res.send('Check the console for results.');
	// res.sendFile(path.join(__dirname + '/README.html'));

	// The URL we will scrape from
    url = 'http://www.cse.ust.hk';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html

    request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            function collectWords($) {
            	var bodyText = $('html > body').text().match(/\w+/g);
            	return bodyText;
            }

            function collectInternalLinks($) {
				var allRelativeLinks = [];
				var allAbsoluteLinks = [];

				var relativeLinks = $("a[href^='/']");
				relativeLinks.each(function() {
				allRelativeLinks.push($(this).attr('href'));

				});

				var absoluteLinks = $("a[href^='http']");
				absoluteLinks.each(function() {
				allAbsoluteLinks.push($(this).attr('href'));
				});

				return [allRelativeLinks, allAbsoluteLinks];
			}

			function stemify(source) {
				var stemmed = [];
				source.forEach(function(data) {
					stemmed.push(stemmer(data));
				});
				return stemmed;
			}

			function readStopwordList() {
				var array = fs.readFileSync('stopwords.txt').toString().split("\n");
				return array;
			}

			function removeStopwords(source) {
				var stopwords = readStopwordList();
				var filtered = [];
				source.forEach(function(data) {
					if(stopwords.indexOf(data) == -1) {
						filtered.push(data);
					}
				});
				return filtered;
			}

			function wordFreq(arr) {
				var freqMap = {};
				arr.forEach(function(w) {
					if (!freqMap[w]) {
						freqMap[w] = 0;
					}
					freqMap[w] += 1;
				});

				return freqMap;
			}

			console.log('Words in '+url+':');
			var words = removeStopwords(collectWords($));
			console.log(words.join(' '));
			console.log('\n\n\n\n');
			console.log('Links in '+url+':');
			var links = collectInternalLinks($);
			console.log("Found " + links[0].length + " relative links");
			links[0].forEach(function(data) {
				console.log(data);
			});
			console.log("Found " + links[1].length + " absolute links");
			links[1].forEach(function(data) {
				console.log(data);
			});

			// Write stemmed words to txt
			var stemmed = stemify(words);
			// fs.writeFile('stemmed.txt', stemmed.join(' '), function(err){
			//     console.log('File successfully written! - Check your project directory for the stemmed.txt file');
			// });

			// Convert stemmed words to freq table
			var freqTable = wordFreq(stemmed);

			// Add table records to db
			for(var key in freqTable) {
				db.put(key, freqTable[key], function (err) {
  					if (err) return console.log('Ooops!', err)
				});
			};

			console.log(db);
        }
    })
});

app.get('/db', function(req, res){
	res.send('The database contents.');
	var stream = db.createReadStream();
	stream.on('data', function(data) {  
		console.log('%s = %j', data.key, data.value);
	});
});

app.listen('8081');

console.log('Magic happens on port 8081');

exports = module.exports = app;