var express = require('express');
var path = require('path');
var fs = require('fs');
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var stemmer = require('porter-stemmer').stemmer;
var levelup = require('level');
var app     = express();

let URL_LIMIT = 30;

// Database Configuration

// Create our database, supply location and options.
// This will create or open the underlying LevelDB store.
var mydb_url_mapping = levelup('./mydb/url_mapping');
var mydb_word_mapping = levelup('./mydb/word_mapping');
var mydb_forward = levelup('./mydb/forward');
var mydb_inverted = levelup('./mydb/inverted');
var mydb_info = levelup('./mydb/info');
var mydb_parent_child = levelup('./mydb/parent_child');
console.log('Databases created at /mydb.');

// Define the databse interface
// update(): append values for existing kv-pairs, create if not exist
// getAll(): return all kv-pairs
var DbInterface = function(options) {
	var db = options.db;
	var interface = {};
	interface.get = function(key) {
		return new Promise(function (resolve, reject) {
			db.get(key, function(err, value) {
				if(err){
					reject(false);
				}
				resolve(value);
			});
		});
	};
	interface.replace = function(key, inputVal) {
		return new Promise(function (resolve, reject) {
			db.put(key, inputVal, function (err) {
				if (err) reject(false);
				resolve();
			});
		});
	};
	interface.update = function(key, inputVal) {
		if(typeof inputVal === 'string'){
			inputVal = [].concat(inputVal);
		}
		// Check if key exists in db
		return new Promise(function (resolve, reject) {
			interface.get(key, function (value) {
				// If exist
				if(value != false){
					// add new record with same key but updated value
					var current = value.split(',');
					var res = current.concat(inputVal);
					db.put(key, res, function (err) {
						if (err) console.log('Db IO Error!', err);
					});
				}
				else {
					// If not exist,
					// Put new record
					db.put(key, inputVal, function (err) {
						if (err) console.log('Db IO Error!', err);
					});
				}
				resolve();
			});
		});
	};
	interface.getAll = function(options, callback) {
		// Method to 
		// 1. transform value(s) only when the key is not excluded
		// 2. return all kv-pairs
		var transformValFunc = options.transformValFunc;
		var excludeKey = options.excludeKey;
		var instance = {};
		var stream = db.createReadStream();
		return new Promise(function (resolve, reject) {
			stream.on('data', function(data) {
				instance[data.key] = data.value;
				// if not excluded (=included), transform the value
				if(excludeKey.indexOf(data.key)==-1){
					if(transformValFunc === null){
						instance[data.key] = data.value;
					}
					else{
						instance[data.key] = transformValFunc(data.value);
					}
				}
			});
			stream.on('end', function() {
				resolve(instance);
			});
		});
	};
	return interface;
} 

var dbInterface_url_mapping = DbInterface({db: mydb_url_mapping});
var dbInterface_word_mapping = DbInterface({db: mydb_word_mapping});
var dbInterface_forward = DbInterface({db: mydb_forward});
var dbInterface_inverted = DbInterface({db: mydb_inverted});
var dbInterface_info = DbInterface({db: mydb_info});
var dbInterface_parent_child = DbInterface({db: mydb_parent_child});

app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/public/app/index.html'));
});

app.get('/admin', function(req, res){
	res.sendFile(path.join(__dirname + '/public/app/index.html'));
});

app.get('/scrape', function(req, res){
	function makeRequest(url) {
		var options = {
		    uri: url,
		    transform: function (body, response) {
		        return {$: cheerio.load(body), headers: response.headers};
		    }
		};

	    var promise = rp(options)
	    	.then(function(response){
	            function collectMeta(response) {
	            	var title = response.$('title').text().trim();
	            	if(!title) {
	            		title = url;
	            	}
	            	// Only for www.cse.ust.hk
	            	var date = response.$('p.right').text().match(/[0-9\-]+/g);
	            	if(date && Array.isArray(date)){
	            		date = date[0];
	            	}
	            	if(!date){
	            		date = response.headers['last-modified'] || response.headers.date;
	            	}
	            	date = date.replace(',', ' ');
	            	var size = response.headers['content-length'] || response.$('html > body').text().trim().length;
	            	return {title: title, date: date, size: size};
	            }

	            function collectWords(response) {
	            	// Remove javascript
	            	response.$('html > body > script').remove();
	            	var bodyText = response.$('html > body').text();
	            	bodyText = bodyText.match(/[A-Za-z0-9]{2,20}/g);

	            	// Force all to lowercase
	            	var result = [];
	            	if(bodyText){
	            		result = bodyText.join('|').toLowerCase().split('|');
	            		bodyText = result;
	            	}
	            	return bodyText;
	            }

	            function collectInternalLinks(response) {
					var allRelativeLinks = [];
					var allAbsoluteLinks = [];

					var relativeLinks = response.$("a[href^='/']");
					relativeLinks.each(function() {
					allRelativeLinks.push(response.$(this).attr('href'));

					});

					var absoluteLinks = response.$("a[href^='http']");
					absoluteLinks.each(function() {
					allAbsoluteLinks.push(response.$(this).attr('href'));
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

				function posFreq(arr) {
					var posMap = {};
					arr.forEach(function(w, pos) {
						if(!posMap[w]){
							posMap[w] = [];
						}
						if(posMap[w].push !== undefined){
							posMap[w].push(pos);
						}
					});
					return posMap;
				}

				var words = collectWords(response);
				if(words === null){
					return;
				}
				wordsFiltered = removeStopwords(words);

				// Stem words
				var stemmed = stemify(wordsFiltered);

				// Convert stemmed words to freq table
				var posTable = posFreq(stemmed);

				dbInterface_url_mapping.getAll({
					transformValFunc: null,
					excludeKey: []
				}).then(function(url_instance){
					var visited = Object.keys(url_instance);
					var url_id = visited.length;
					console.log(url_id);
					// Add mapping for URL
					// URL -> Url ID
					dbInterface_url_mapping.replace(url, url_id).then(function(){
						// Add page info
						// Url ID -> Info
						var raw_meta = collectMeta(response);
						dbInterface_info.replace(url_id, [raw_meta.title, raw_meta.date, raw_meta.size, words.length]).then(function(){
							// Add mapping for Word -> Word ID
							var word_promises = Object.keys(posTable).map(function(key) {
								return dbInterface_word_mapping.getAll({
									transformValFunc: null,
									excludeKey: []
								}).then(function(word_instance){
									var word_id = Object.keys(word_instance).length;
									dbInterface_word_mapping.replace(key, word_id).then(function(){
										// Update/Add inverted index
										// Word ID -> array of word positions in a document
										dbInterface_inverted.update(word_id, [url_id, posTable[key].length].concat(posTable[key]));
									});
								});
							});
							Promise.all(word_promises).then(function(){
								// Add forward index
								// Url ID -> words
								dbInterface_forward.replace(url_id, Object.keys(posTable)).then(function(){


									var allLinks = collectInternalLinks(response);

									// Unique links
									var links = Array.from(new Set(allLinks[1]));

									// Pre-process links
									var filteredLinks = [];
									links.forEach(function(l){
										// Remove links containing 'unsupportedbrowser'
										// Remove visited links
										if (l.indexOf('unsupportedbrowser') == -1 && visited.indexOf(l) == -1) {
											// Remove trailing slash
											var res = l.replace(/\/$/, "");
											res = res.replace(/\?(.*?)$/, "");
											filteredLinks.push(res);
										}
									});
									dbInterface_parent_child.replace(url, filteredLinks).then(function(){
										if(visited.length >= URL_LIMIT){
											return promise;
										}
										else{
											var childrenRequests = [];
											if(URL_LIMIT - visited.length - 1 < filteredLinks.length) {
												filteredLinks = filteredLinks.slice(0,URL_LIMIT-visited.length);
											}
											filteredLinks.forEach(function(cl, idx) {
												if(idx>0){
													visited = visited.concat(filteredLinks.slice(0,idx));
													visited = Array.from(new Set(visited));
												}
												childrenRequests.push(makeRequest(cl));
											});
											childrenRequests.forEach(function(request){
							    				promise = promise.then(request);
						    				});
										}
									})
								});
							});
						});
					});
				});
			}).catch(function(err){

			});

			return promise;
	}

	// The URL we will scrape from
    var ROOT = 'http://www.cse.ust.hk';
    console.log('Scrape started...');
	makeRequest(ROOT).then(function(){
		console.log('Scrape completed.');
		res.send('Check console for results.');
	}).catch(function(err){

	});
});

app.get('/db_url_mapping', function(req, res){
	dbInterface_url_mapping.getAll({
		transformValFunc: null,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/db_word_mapping', function(req, res){
	dbInterface_word_mapping.getAll({
		transformValFunc: null,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/db_forward', function(req, res){
	var stringToArr = function(s) {
		var arr = s.split(',');
		return arr;
	};
	dbInterface_forward.getAll({
		transformValFunc: stringToArr,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/db_inverted', function(req, res){
	var invertedToArr = function(s) {
		var res = [];
		var arr = s.split(',');
		var i = 0;
		while(i<arr.length){
			var urlId = arr[i];
			var posnum = arr[i+1];
			if(posnum>0){
				var posdata = arr.slice(i+2, i+posnum+1);
				res.push({'id': urlId, 'data': posdata});
				i = i + posnum + 1;
			}
			else{
				i++;
			}
		}
		return res;
	};
	dbInterface_inverted.getAll({
		transformValFunc: invertedToArr,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/db_info', function(req, res){
	var stringToArr = function(s) {
		var arr = s.split(',');
		return arr;
	};
	dbInterface_info.getAll({
		transformValFunc: stringToArr,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/db_parent_child', function(req, res){
	var stringToArr = function(s) {
		var arr = s.split(',');
		return arr;
	};
	dbInterface_parent_child.getAll({
		transformValFunc: stringToArr,
		excludeKey: []
	}, function(instance){
		res.json(instance);
	});
});

app.get('/spider_result', function(req, res){
	function generateSpiderEntry(inputs) {
		var title = inputs.meta.title;
		var url = inputs.url;
		var date = inputs.meta.date;
		var size = inputs.meta.size;
		var posFreq = inputs.posFreq;
		var childLinks = inputs.childLinks;

		function parsePosFreq(input) {
			if(input==null) return null;
			var string = '';
			Object.keys(input).forEach(function(key){
				string = string+key+' '+input[key].length+'; ';
			});
			return string;
		}

		var result = [title,url,date+', '+size,parsePosFreq(posFreq)];
		result = result.concat(childLinks,'--------------------------------------------------',null);

		return result.join('\n');
	}

	var stringToArr = function(s) {
		var arr = s.split(',');
		return arr;
	};

	var spider_contents = "";
	dbInterface_info.getAll({
		transformValFunc: stringToArr,
		excludeKey: []
	}, function(urls){
		dbInterface_url_mapping.getAll({
			transformValFunc: stringToArr,
			excludeKey: []
		}, function(url_mappings){
			url_mappings = Object.keys(url_mappings).sort(function(a,b){return parseInt(url_mappings[a])-parseInt(url_mappings[b])});
			dbInterface_parent_child.getAll({
				transformValFunc: stringToArr,
				excludeKey: []
			}, function(children){
				dbInterface_inverted.getAll({
					transformValFunc: stringToArr,
					excludeKey: []
				}, function(inverted){
					Object.keys(urls).forEach(function(url_key){
						if(url_mappings[url_key]){
							spider_contents = spider_contents + generateSpiderEntry({
								meta: {
									title: urls[url_key][0],
									date: urls[url_key][1],
									size: urls[url_key][2]
								},
								url: url_mappings[url_key],
								// posFreq: inverted[url_key],
								childLinks: children[url_mappings[url_key]]
							});
						}
					});
					console.log(spider_contents);
					res.set({"Content-Disposition":"attachment; filename=\"spider_result.txt\""});
					// res.send(spider_contents);
				});
			});
		});
	});
});

app.use(function(req, res){
	res.sendStatus(404);
});

app.listen('8081');

console.log("   ___                      _      \n  |_  |                    (_)     \n    | |  __ _  _ __ __   __ _  ___ \n    | | / _` || '__|\ \ / /| |/ __|\n /\__/ /| (_| || |    \ V / | |\__ \\\n  \____/  \__,_||_|     \_/  |_||___/\n                                   \n");
console.log('Jarvis standing-by on port 8081.');

exports = module.exports = app;