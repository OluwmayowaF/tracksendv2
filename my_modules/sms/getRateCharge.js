/* 

*/
const Sequelize = require('sequelize');
const models = require('../../models');
const phoneval = require('../phonevalidate');

const getRateCharge = async (phone, ctry, user_id) => {

  let formatphone = phoneval(phone, ctry);
  let results = null;

  if(!formatphone) return null;
  
  var res_charge = await models.Settingsnetwork.findOne({
    where: {
      [Sequelize.Op.and]: [
        Sequelize.where(
          Sequelize.fn('LOCATE', Sequelize.col('prefix'), phone), 1
        ),
        { countryId: ctry },
      ]
    },
    attributes: ['id', 'cost'],
    include: [{
      required: false,
      model: models.Settingsuserbilling,
      where: {
        userId: user_id
      },
      attributes: ['cost']
    }],
    raw: true
  })

  console.log('res_charge1: ' + JSON.stringify(res_charge));
  if(res_charge) {
    results = res_charge['settingsuserbillings.cost'] ? res_charge['settingsuserbillings.cost'] : res_charge.cost;
  } 
  
  console.log('getRateCharge: ' + phone + ' = ' + JSON.stringify(results));

  return results;

}

module.exports = getRateCharge;
