/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
var models = require('../models');

const apiAuthToken = async (id, token) => {
  console.log('ggggggg');
  
  if(!id || !token) return false;
  console.log('rrrrrrrrr');
  
  let check = await models.User.findOne({
    where: {
      id,
      api_key: token,
    },
    attributes: ['id']
  })

  return check ? true : false;

}

module.exports = apiAuthToken;
