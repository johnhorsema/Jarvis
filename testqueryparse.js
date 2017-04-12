function queryParse(string) {
	var phrases = string.match(/\"[^\"]+\"/g).map(function(item){
		return item.replace(/\"/g,"");
	});
	var others = string.replace(/\"[^\"]+\"/g, "").trim().split(/\s+/);
	return [others, phrases]
}

console.log(queryParse('accurate "on the" stuff "some what"'))