function magnitude(v){
	return Math.sqrt(v.reduce(function(a,b){
		return Math.pow(a,2)+Math.pow(b,2);
	}));
}

console.log(magnitude([0,0]))