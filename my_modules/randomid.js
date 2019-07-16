/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

var randomid = function (n, typ = 'num') {
  // console.log('number is = ' + n + '; type is = ' + typ);

  var arr = [0,1,2,3,4,5,6,7,8,9];
  var len = arr.length;
  var id = '';
  for (let i = 0; i < n; i++) {
    var r = Math.floor(Math.random() * len).toString();
    id += r;
  }
  return id;
}

module.exports = randomid;
