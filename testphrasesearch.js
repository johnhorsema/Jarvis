var query = "\"rare bird\" discovered";

var pos_info = {
  "rare": {"page0": [23], "page1": [56, 89], "page2": [3]},
  "bird": {"page2": [2], "page1": [57]}
};

var pageLength = {"page0": 200, "page1": 100, "page2": 100};
var pages = ['page0', 'page1', 'page2'];

function getTf(tf, docLength){
  return tf/docLength;
}

function getIdf(total, hasTermnum){
  if(hasTermnum==0){
    return 1;
  }
  return 1 + Math.log(total/hasTermnum)
}

var assert = require('assert');

function queryToTfidf(query){
  var arr = query.split(' ');
  return pages.map(function(doc){
    return arr.map(function(word){
      if(pos_info[word]==undefined){
        return 0;
      }
      hasTermnum = Object.keys(pos_info[word]).length;
      var tf = 0;
      if(pos_info[word][doc]!=undefined){
        tf = pos_info[word][doc].length;
      }
      return getTf(tf, pageLength[doc])*getIdf(3, hasTermnum);
    });
  });
}

function findDiffOne(a,b){
  var num = 0;
  a.forEach(function(aitem){
    b.forEach(function(bitem){
      if(Math.abs(aitem-bitem)==1){
        num++;
      }
    });
  });
  return num;
}

function tfPhrase(p, doc){
  var words = p.split(' ');
  return words.reduce(function(a, b){
    // Need to satisfy one condition
    // 1. Both exist on same page
    // return number of pairs of abs(pos_0, pos_1)
    if(pos_info[a][doc]==undefined || pos_info[b][doc]==undefined){
      return 0;
    }
    return findDiffOne(pos_info[a][doc],pos_info[b][doc]);
  });
}

function phraseToTf(pquery){
  return pages.map(function(doc){
    // Calculate its tfidf
    // e.g. tfidf for "rare bird"
    return {tf: tfPhrase(pquery, doc), doc: doc};
  });
}

// Test query without quotes
// rare, bird, discovered
var result = queryToTfidf(query.replace(/\"/g,''));
assert.deepEqual([
  [1/200*(1+Math.log(3/3)),0,0],
  [2/100*(1+Math.log(3/3)),1/100*(1+Math.log(3/2)),0],
  [1/100*(1+Math.log(3/3)), 1/100*(1+Math.log(3/2)), 0]
], result);

// Test query with quotes
// 'rare bird', discovered

// Find the phrased segment
var phrase_query = query.match(/\"([\w\s]+)\"/)[1];
var phrase_length = phrase_query.split(' ').length;
var tfres = phraseToTf(phrase_query);
var tfresNonZeroNum = tfres.filter(function(i){
  return i.tf>0;
}).length;
var result_q = tfres.map(function(data){
  var TF = data.tf/(pageLength[data.doc]-Math.pow(Math.max(1,data.tf),phrase_length-1));
  var IDF = 1+Math.log(3/tfresNonZeroNum)
  return TF*IDF;
});
assert.deepEqual([
0,
1/99*(1+Math.log(3/2)),
1/99*(1+Math.log(3/2))
],result_q)

// Another case where phrase occurs more than once
// Page3 has three occurences of "rare birds"
// Page3 should be the winner
pos_info = {
  "rare": {"page0": [23], "page1": [56, 89], "page2": [3], "page3": [4,12,20]},
  "bird": {"page2": [2], "page1": [57], "page3": [5,13,21]}
};

pageLength = {"page0": 200, "page1": 100, "page2": 100, "page3": 100};
pages = ['page0', 'page1', 'page2', 'page3'];

phrase_query = query.match(/\"([\w\s]+)\"/)[1];
phrase_length = phrase_query.split(' ').length;
tfres = phraseToTf(phrase_query);
tfresNonZeroNum = tfres.filter(function(i){
  return i.tf>0;
}).length;
result_q = tfres.map(function(data){
  var TF = data.tf/(pageLength[data.doc]-Math.pow(Math.max(1,data.tf),phrase_length-1));
  var IDF = 1+Math.log(4/tfresNonZeroNum)
  return TF*IDF;
});
assert.deepEqual([
0,
1/99*(1+Math.log(4/3)),
1/99*(1+Math.log(4/3)),
3/97*(1+Math.log(4/3))
],result_q)

