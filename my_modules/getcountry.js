/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
var models = require('../models');

const getCountry = async (ctryid) => {

  let country = await models.Country.findByPk(ctryid,
    {
        attributes: ['id', 'name', 'abbreviation'],
        raw: true,
    })

  return country;

}

module.exports = getCountry;
