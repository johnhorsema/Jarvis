var query = '"rare bird" discovered';
var phrase_query = query.match(/\"(.*?)\"/g)[0];

var pos_info = {
  "rare": {"page0": [23], "page1": [56, 89], "page2": []},
  "bird": {"page2": [2], "page1": [57], "page0": []}
};

var pageLength = {"page0": 200, "page1": 100, "page2": 100};
var pages = ['page0', 'page1', 'page2'];

function getTf(tf, docLength){
  return tf/docLength;
}

function getIdf(total, hasTermnum){
  return 1 + Math.log(total/hasTermnum)
}

function queryToTfidf(query){
  var arr = query.split(' ');
  return pages.map(function(doc){
    return arr.map(function(word){
      var hasTermnum = 0;
      if(pos_info[word]==undefined){
        return 0;
      }
      if(pos_info[word][doc]==undefined){
        return 0;
      }
      hasTermnum = pos_info[word][doc].length;
      return getTf(Object.keys(pos_info[word]).length, pageLength[doc])*getIdf(3, hasTermnum);
    });
  });
}

var result = queryToTfidf(query.replace("\"", ""));
console.log(result);
