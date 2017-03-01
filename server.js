var express = require('express');
var path = require('path');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var stemmer = require('porter-stemmer').stemmer;
var level = require('level-rocksdb')
var app     = express();

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/scrape', function(req, res){
	// res.send('Check the console for results.');
	res.sendFile(path.join(__dirname + '/README.html'));

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


			fs.writeFile('stemmed.txt', stemify(words).join(' '), function(err){
			    console.log('File successfully written! - Check your project directory for the stemmed.txt file');
			})
        }
    })
});

app.get('/db', function(req, res){
	// 1) Create our database, supply location and options.
	//    This will create or open the underlying LevelDB store.
	var db = level('./mydb');

	// 2) put a key & value
	db.put('name', 'Level', function (err) {
	  if (err) return console.log('Ooops!', err) // some kind of I/O error

	  // 3) fetch by key
		db.get('name', function (err, value) {
		    if (err) return console.log('Ooops!', err) // likely the key was not found

		    // ta da!
		console.log('name=' + value)
		})
	});
});

app.listen('8081');

console.log('Magic happens on port 8081');

exports = module.exports = app;