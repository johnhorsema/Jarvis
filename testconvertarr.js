function invertedToArr(s) {
	var res = [];
	var arr = s.split(',');
	var i = 0;
	while(i<arr.length){
		var urlId = parseInt(arr[i++]);
		var posnum = parseInt(arr[i++]);
		if(posnum>0){
			console.log('slice', i, i+posnum);
			var posdata = arr.slice(i, i+posnum);
			res.push({'id': urlId, 'data': posdata});
		}
		i+=posnum;
	}
	return res;
}

console.log(invertedToArr('3,1,0,3,1,5'));
console.log(invertedToArr('3,1,0,3,1,5')==[{id: 3, data: [0]},{id: 3, data: [5]}]);