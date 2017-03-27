var leveldown = require('leveldown');
leveldown.destroy('./mydb/url_mapping', function (err) { console.log('Database mydb/url_mapping destroyed. Run npm start to create a new one.') });
leveldown.destroy('./mydb/word_mapping', function (err) { console.log('Database mydb/word_mapping destroyed. Run npm start to create a new one.') });
leveldown.destroy('./mydb/forward', function (err) { console.log('Database mydb/forward destroyed. Run npm start to create a new one.') });
leveldown.destroy('./mydb/inverted', function (err) { console.log('Database mydb/inverted destroyed. Run npm start to create a new one.') });
leveldown.destroy('./mydb/info', function (err) { console.log('Database mydb/info destroyed. Run npm start to create a new one.') });
leveldown.destroy('./mydb/parent_child', function (err) { console.log('Database mydb/parent_child destroyed. Run npm start to create a new one.') });