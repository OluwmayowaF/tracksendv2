/* 

   

*/

const getRateCharge = async (phone, ctry, user_id) => {
  const sequelize = require('../../config/cfg/db');
  var models = require('../../models');

  let prefix = phone.substr(0, 4);

  var res_charge = await sequelize.query(
    "SELECT units FROM settingsuserbillings " +
    "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
    "WHERE settingsuserbillings.userId = (:id) " +
    "AND settingsnetworks.prefix = '" + prefix + "'", {
        replacements: {id: user_id},
    }
  );

  console.log('RES!!!' + JSON.stringify(res_charge));

  if(res_charge[0][0] && res_charge[0][0].units) {
      console.log('444444');
      var results = res_charge[0][0].units;
      
  } else {

      let res_rcharge = await models.Settingsnetwork.findAll({
          where: { 
              prefix: prefix,
              countryId: ctry,
          },
          attributes: ['unitscharge'], 
          limit: 1,
      });

      console.log('RRES!!!' + JSON.stringify(res_rcharge));
      console.log('RRES!!!' + res_rcharge.map((r) => r.unitscharge));
      var results = res_rcharge.map((r) => r.unitscharge);

      console.log('555555');
  }
// console.log('%%%%%%%%%%%%%%%%%%%%%: ' + phone + ' = ' + results);


  return results;

}

module.exports = getRateCharge;
