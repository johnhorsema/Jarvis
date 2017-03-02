var express = require('express');
var path = require('path');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var stemmer = require('porter-stemmer').stemmer;
var levelup = require('level');
var app     = express();

let URL_LIMIT = 14;

// 2, 16
// 4, 18
// 8, 29
// 14, 278
// 16, 61
// 32, 843

// Database Configuration

// Create our database, supply location and options.
// This will create or open the underlying LevelDB store.
var db = levelup('./mydb')
console.log('Database created at /mydb.');

app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/public/app/index.html'));
});

app.get('/admin', function(req, res){
	res.sendFile(path.join(__dirname + '/public/app/index.html'));
});

app.get('/scrape', function(req, res){
	res.send('Check the console for results.');
	// res.sendFile(path.join(__dirname + '/README.html'));

    function makeRequest(url, count, urlCollection){
    	if(urlCollection.length>URL_LIMIT) return;
    	if(urlCollection.indexOf(url)!=-1) return;

    	console.log('Start scraping: '+url);

	    // The structure of our request call
	    // The first parameter is our URL
	    // The callback function takes 3 parameters, an error, response status code and the html

	    request(url, function(error, response, html){

	        // First we'll check to make sure no errors occurred when making the request

	        if(!error){
	            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

	            var $ = cheerio.load(html);

	            function getTitle($) {
	            	var title = $('title').text();
	            	return title;
	            }

	            function collectWords($) {
	            	var bodyText = $('html > body').text().match(/[A-Za-z0-9]{2,20}/g);
	            	// Force all to lowercase
	            	var result = [];
	            	if(bodyText){
	            		result = bodyText.join('|').toLowerCase().split('|');
	            		bodyText = result;
	            	}
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

				// console.log('Words in '+url+':');
				var words = collectWords($);
				if(words === null){
					return;
				}
				words = removeStopwords(words);
				// console.log(words.join(' '));
				// console.log('\n\n\n\n');
				// console.log('Links in '+url+':');
				var links = collectInternalLinks($);
				// console.log("Found " + links[0].length + " relative links");
				// links[0].forEach(function(data) {
				// 	console.log(data);
				// });
				// console.log("Found " + links[1].length + " absolute links");
				// links[1].forEach(function(data) {
				// 	console.log(data);
				// });

				// Write stemmed words to txt
				var stemmed = stemify(words);
				// fs.writeFile('stemmed.txt', stemmed.join(' '), function(err){
				//     console.log('File successfully written! - Check your project directory for the stemmed.txt file');
				// });

				// Convert stemmed words to freq table
				var freqTable = wordFreq(stemmed);

				// Add table records to db
				Object.keys(freqTable).forEach(function(key) {
					// Check if key exists in db
					var exist = true;
					db.get(key, function (err, value) {
						if(err){
							exist = !err.notFound;
						}
						// If exist
						if(exist) {
							// add new record with same key but updated value
							var current = value.split(',');
							db.put(key, current.concat([freqTable[key], url]), function (err) {
								if (err) console.log('Db IO Error!', err);
							});
						}
						else {
							// If not exist,
							// Add new record
							db.put(key, [freqTable[key], url], function (err) {
								if (err) console.log('Db IO Error!', err);
							});
						}
					});
				});

				console.log('Done Scraping: '+url+'('+count+')');
				urlCollection.push(url);
				db.put('url_size', urlCollection.length, function (err) {
					if (err) console.log('Db IO Error!', err);
				});

				if(links[1] && urlCollection.length<URL_LIMIT+1){
					links[1].forEach(function(link, idx){
						count++;
			    		makeRequest(link, count, urlCollection);
					});
				}
	        }
	    });
    }

    // The URL we will scrape from
    var ROOT = 'http://www.cse.ust.hk';

    makeRequest(ROOT, 0, []);
});

app.get('/db', function(req, res){
	function stringToArray(s) {
		var res = [];
		var arr = s.split(',');
		for(var i=0; i<arr.length; i+=2) {
			var subarr = [];
			subarr.push(arr[i]);
			subarr.push(arr[i+1]);
			res.push(subarr);
		}
		return res;
	}
	var instance = {};
	var stream = db.createReadStream();
	stream.on('data', function(data) {
		instance[data.key] = stringToArray(data.value);
		if(data.key=='url_size'){
			instance[data.key] = data.value;
		}
	});
	stream.on('end', function() {
		res.json(instance);
	});
});

app.use(function(req, res){
	res.sendStatus(404);
});

app.listen('8081');

console.log('Magic happens on port 8081');

exports = module.exports = app;