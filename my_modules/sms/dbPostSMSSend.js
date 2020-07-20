var moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var models = require('../../models');

exports.dbPostSMSSend = async(req, res, batches, successfuls = 0, failures = 0, info, user_balance, user_id, cpn, schedule_, klist = null, response = null, networkerror = null) => {
  //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
  console.log('dbPostSMSSend -- 11');
  
  if(response) {
      console.log('dbPostSMSSend -- 22');
      //  update message with id after success
      if(response.SMSMessageData) {         //  afrikastalking response
          console.log('let recps = ' + JSON.stringify(response.SMSMessageData));
          let recps = response.SMSMessageData.Recipients;
          recps.forEach(async recp => {
              if(recp.statusCode === 101 || recp.statusCode === 100) successfuls++;
              else failures++;

              await models.Message.update(
                  {
                      message_id: recp.messageId
                  },
                  {
                      where: {
                          campaignId: cpn.id,
                          destination: recp.number,
                      }
                  }
              )
          });
          if(!recps.length) failures = batches;
      } else {
          await models.Message.update(
              {
                  message_id: response.id
              },
              {
                  where: {
                      campaignId: cpn.id,
                      contactId: {
                          [Op.in]: klist,
                      },
                  }
              }
          )
      }
  }

  console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures + '; batches = ' + batches);
  if((successfuls + failures) >= batches) {
      console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures);
      console.log('________________________INFO22='+ JSON.stringify(info));

      let _status = {};
      
      try {
          if(!networkerror && successfuls > 0) {   
          // if(true) {       //  kenni
              let new_bal = parseFloat(user_balance.balance) - parseFloat(info.units_used);
              console.log('old bal = ' + user_balance.balance + '; units used = ' + info.units_used + '; NEW BALANCE = ' + new_bal);

              let usr = await models.User.findByPk(user_id)
              //  UPDATE UNITS USER BALANCE
              await usr.update({
                  balance: new_bal,
              });
              //  UPDATE UNITS USED FOR CAMPAIGN
              await cpn.update({
                  units_used: info.units_used,
                  status: 1
              });

              //  LOG TRANSACTIONS
              await models.Transaction.create({
                  description: 'DEBIT',
                  userId: user_id,
                  type: 'CAMPAIGN',
                  ref_id: cpn.id,
                  units: (-1) * info.units_used,
                  status: 1,
              })

              //  CONVERT REFS FROM TEMP REFS TO REAL REFS
              await models.Tmpcampaign.update(
                  {
                      ref_campaign: cpn.id,
                  }, {
                      where: {
                          ref_campaign: "tmpref_" + info.id
                      }
                  }
              )

              //  REMOVE TEMPORARY DATA
              if(!req.externalapi) await info.destroy();

              let mm = (schedule_) ? 'scheduled to be sent out at ' + moment(schedule_, 'YYYY-MM-DD HH:mm:ss').add(1, 'hour').format('h:mm A, DD-MMM-YYYY') + '.' : 'sent out.';
              
              _status = {
                  response: "Success. Messages sent.", 
                  responseType: "OK", 
                  responseCode: "P001", 
                  responseText: "Campaign created successfully. Messages " + mm, 
              }


          } else if(networkerror) {

              await models.Message.destroy({
                  where: {
                      campaignId: cpn.id,
                  }
              });
              await cpn.destroy();

              _status = {
                  response: "Error: Campaign sending error!", 
                  responseType: "ERROR", 
                  responseCode: "E006", 
                  responseText: "An error occurred while sending out your Campaign. Check your network connection, and ensure you\'re logged in.", 
              }
          } else {

              await cpn.destroy();

              _status = {
                  response: "Error: Campaign sending error!", 
                  responseType: "ERROR", 
                  responseCode: "E007", 
                  responseText: "An error occurred while sending out your Campaign. Please try again later or contact admin.", 
              }
          }
      } catch (err) {
          console.error('THIS ERROR: ' + err);
      }

      if(req.externalapi) {
          return _status;
      } else {
          try {
              req.flash(_status.responseType == "OK" ? 'success' : _status.responseType.toLowerCase(), _status.responseText);
              var backURL = req.header('Referer') || '/';
              res.redirect(backURL);
          } catch(err) {
              console.log('HEADERS ALREADY SENT! - ' + err);
              
          }
      }
  } 
}