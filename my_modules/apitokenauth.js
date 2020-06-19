/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
var models = require('../models');

const apiAuthToken = async (token) => {
  console.log('ggggggg');
  
  if(!token) return false;
  console.log('rrrrrrrrr');
  
  let check = await models.User.findOne({
    where: {
      api_key: token,
    },
    attributes: ['id']
  })

  console.log('check___', JSON.stringify(check));
  
  return check ? check.id : false;

}

module.exports = apiAuthToken;
