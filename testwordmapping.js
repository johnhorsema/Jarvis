var assert = require('assert');

var db = {};
var result = {'I': 0, 'did': 1, 'enact': 2, 'have': 3, 'done': 4};

function saveArr(arr){
	function saveOperation(key, val){
		if(db[val] === undefined){
			db[val] = key;
		}
	}
	var size = Object.keys(db).length;
	if(size>0){
		size--;
	}
	arr.forEach(function(val, idx){
		saveOperation(size+idx, val);
	});
}



var input1 = 'I did enact';
var input2 = 'I have done';

saveArr(input1.split(' '));
saveArr(input2.split(' '));
assert.deepEqual(db, result);