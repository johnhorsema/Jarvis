var findPhrase = function(raw){
  var res_query = {query: raw, phrase_query: ''};
  var phrase_query = raw.match(/\"([\w\s]+)\"/);
  if(phrase_query != null){
    var phrase_length = phrase_query[1].split(' ').length;
    res_query.phrase_query = phrase_query[1].trim();
    res_query.query = raw.replace(phrase_query[0],"").trim();
  }
  return res_query;
}

var res = findPhrase('hong kong holiday');
console.log(res);
