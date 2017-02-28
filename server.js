var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape', function(req, res){
	// The URL we will scrape from
    url = 'http://www.cs.ust.hk/~dlee/4321/';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html

    request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            function collectWords($) {
            	var bodyText = $('html > body').text().match(/\S+/g);
            	console.log(bodyText.join(' '));
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

				console.log("Found " + allRelativeLinks.length + " relative links");
				allRelativeLinks.forEach(function(data) {
					console.log(data);
				});
				console.log("Found " + allAbsoluteLinks.length + " absolute links");
				allAbsoluteLinks.forEach(function(data) {
					console.log(data);
				});
			}

			console.log('Words in '+url+':');
			collectWords($);
			console.log('\n\n\n\n');
			console.log('Links in '+url+':');
			collectInternalLinks($);
        }
    })
})

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;