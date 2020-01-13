/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const randGen = (field, modl, len = 24, typ = 'num', separator = '') => {

  var randomid = function (n, typ) {
    // console.log('number is = ' + n + '; type is = ' + typ);
    var arr;

    if(typ == 'num')          arr = ['0','1','2','3','4','5','6','7','8','9'];
    if(typ == 'alph')         arr = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    if(typ == 'alphnum')      arr = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
                                     '0','1','2','3','4','5','6','7','8','9'];
    if(typ == 'fullalphnum')  arr = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
                                     'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                                     '0','1','2','3','4','5','6','7','8','9'];
    if(separator) {
      let itr = Math.ceil(len / 8), i = 0;
      do {
        arr[arr.length] = separator;
        i++;
      } while (i <= itr)
    }
    
    var len = arr.length;
    var id = '';
    for (let i = 0; i < n; i++) {
      var r = arr[Math.floor(Math.random() * len)];//.toString();
      id += r;
    }
    return id;

  }

  const doGenerate = () => {

    var id = randomid(len, typ)
    if(!field && !modl) return id;
    
    return modl.findAll({
      where: {
        [field]: id,
      }
    })
    .then((resp) => {
      if(resp.length) doGenerate();
      else return id;
    })

  }

  return doGenerate();

}

module.exports = randGen;
