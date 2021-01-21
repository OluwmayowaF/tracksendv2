/* 

*/
var phoneval = require('../phonevalidate');

const getRateCharge = async (phone, ctry, user_id) => {
  const sequelize = require('../../config/cfg/db');
  var models = require('../../models');

  let formatphone = phoneval(phone, ctry);
  let result = null;

  if(!formatphone) return null;
  
  //  this prefix concept only works for nigerian phone lines
  let prefix = formatphone.substr(0, 4);

  /* var res_charge = await sequelize.query(
    "SELECT settingsuserbillings.cost FROM settingsuserbillings " +
    "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
    "WHERE settingsuserbillings.userId = (:id) " +
    "AND settingsnetworks.prefix = '" + prefix + "'", {
        replacements: {id: user_id},
    }
  ); */
  var res_charge = await models.Settingsnetwork.findOne({
    where: {
      prefix: prefix,
      countryId: ctry,
    },
    attributes: ['id'],
    include: [{
      model: models.Settingsuserbilling,
      where: {
        userId: user_id
      },
      attributes: ['cost']
    }],
    raw: true
  })

  console.log('res_charge1: ' + JSON.stringify(res_charge));
  // if(res_charge && res_charge[0][0] && res_charge[0][0].cost) {
  if(res_charge && res_charge['settingsuserbillings.cost']) {
      console.log('res_charge YES');
      results = res_charge['settingsuserbillings.cost'];
      
    } else {
      console.log('res_charge NO');

      let res_rcharge = await models.Settingsnetwork.findOne({
          where: { 
              prefix: prefix,
              countryId: ctry,
          },
          attributes: ['cost'], 
      });

      console.log('RRES!!!' + JSON.stringify(res_rcharge));
      // console.log('RRES!!!' + res_rcharge.map((r) => r.cost));
      // var results = res_rcharge.map((r) => r.cost);
      results = res_rcharge.cost;

      console.log('555555');
  }
  
  console.log('getRateCharge: ' + phone + ' = ' + JSON.stringify(results));

  return results;

}

module.exports = getRateCharge;
