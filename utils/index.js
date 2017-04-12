// utils/index.js
// Contains utility functions/classes for the server
// 1. Database Interface
// 2. Word preprocessing (stopword remover, stemmer, posmtable generator)
// 3. Transformation functions for i/o

var fs = require('fs');
var stemmer = require('porter-stemmer').stemmer;

// Section 1
// Define the database interface
// update(): append values for existing kv-pairs, create if not exist
// getAll(): return all kv-pairs
var DbInterface = function(options) {
	var db = options.db;
	var interface = {};
	// Will resolve anyways to produce false value
	interface.get = function(key) {
		return new Promise(function (resolve, reject) {
			db.get(key, function(err, value) {
				if(err){
					resolve(false);
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
	interface.update = function(key, inputVal, forced=true) {
		if(typeof inputVal === 'string'){
			inputVal = [].concat(inputVal);
		}
		// Check if key exists in db 
		interface.get(key).then((value) => {
			// If not exist
			if(value === false) {
				return interface.replace(key, inputVal);
			}
			// If exist
			if(forced){
				// If needs to include existing values
				var current = value.split(',');
				var res = current.concat(inputVal);
				return interface.replace(key, res);
			}
			else{
				// Keep existing value and ignore input value
				return Promise.resolve();
			}
		});
	};
	interface.getAll = function(options) {
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
};

// Section 2
function stemify(source) {
	var stemmed = [];
	source.forEach(function(data) {
		stemmed.push(stemmer(data));
	});
	return stemmed;
}

function readStopwordList() {
	var array = fs.readFileSync('utils/stopwords.txt').toString().split("\n");
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

function wordsToStemmed(words) {
	return stemify(removeStopwords(words));
}

function wordsToPosTable(words) {
	return posFreq(stemify(removeStopwords(words)));
}

// Section 3
function stringToArr(s) {
	var arr = s.split(',');
	return arr;
}

function invertedToArr(s) {
	var res = [];
	var arr = s.split(',');
	var i = 0;
	while(i<arr.length){
		var urlId = parseInt(arr[i++]);
		var posnum = parseInt(arr[i++]);
		if(posnum>0){
			var posdata = arr.slice(i, i+posnum);
			var obj = {};
			obj[urlId] = posdata;
			res.push(obj);
		}
		i = i + posnum;
	}
	return res;
}

function queryParse(string) {
	var havePhrase = string.match(/\"[^\"]+\"/g);
	if(havePhrase){
		var phrases = havePhrase.map(function(item){
			return item.replace(/\"/g,"");
		});
	}
	var others = string.replace(/\"[^\"]+\"/g, "").trim().split(/\s+/);
	return [others, phrases]
}

function dotProduct(a,b) {
	return a.map(function(x,i) {
		return a[i] * b[i];
	}).reduce(function(m,n) { return m + n; });
}

exports.DbInterface = DbInterface;
exports.wordsToStemmed = wordsToStemmed;
exports.wordsToPosTable = wordsToPosTable;
exports.stringToArr = stringToArr;
exports.invertedToArr = invertedToArr;
exports.queryParse = queryParse;
exports.dotProduct = dotProduct;