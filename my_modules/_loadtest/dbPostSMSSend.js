var moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var models = require('../../models');
const mongoose = require('mongoose');
var mongmodels = require('../../models/_mongomodels');

exports.dbPostSMSSend = async(req, res, batches, successfuls = 0, failures = 0, info, user_balance, user_id, cpn, schedule_, klist = null, response = null, networkerror = null) => {
    //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
    console.log('dbPostSMSSend -- 11');
    user_balance = (user_balance.balance) ? user_balance.balance : user_balance;
  
    if(response) {
        console.log('dbPostSMSSend -- 22');
        //  update message with id after success
        if(response.SMSMessageData) {         //  afrikastalking response
            console.log('let recps = ' + JSON.stringify(response.SMSMessageData));
            let recps = response.SMSMessageData.Recipients;
            for(let mm = 0; mm < recps.length; mm++) {
                let recp = recps[mm];

                if(recp.statusCode === 101 || recp.statusCode === 100) successfuls++;
                else failures++;

                console.log('...........cpn.id=' + cpn.id + '; recp.number=' + recp.number + '; recp.messageId=' + recp.messageId );
                await models.Message.update(
                    {
                        message_id: recp.messageId
                    },
                    {
                        where: { 
                            campaignId: cpn.id.toString(),
                            destination: recp.number,
                        }
                    }
                )
            };
            if(!recps.length) failures = batches;
        } else {
            await models.Message.update(
                {
                    message_ids: ['response.id']
                },
                {
                    where: {
                        campaignId: cpn.id.toString(),
                        contactId: {
                            [Op.in]: klist,
                        },
                    }
                }
            )
            .catch((err) => {
                console.log('Message.update FakeERROR: ' + err);
            })
    }
    }

    console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures + '; batches = ' + batches);
    if((successfuls + failures) >= batches) {
        console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures);
        // console.log('________________________INFO22='+ JSON.stringify(info));

        let _status = {};
        
        try {
            if(!networkerror && successfuls > 0) {   
                if(!req.perfcampaign) {
                    console.log('.................................updating status for ' + cpn._id);
                    
                    let new_bal = parseFloat(user_balance) - parseFloat(info.units_used);
                    console.log('old bal = ' + user_balance + '; units used = ' + info.units_used + '; NEW BALANCE = ' + new_bal);

                    let usr = await models.User.findByPk(user_id)
                    //  UPDATE UNITS USER BALANCE
                    await usr.update({
                        balances: 'new_bal',
                    })
                    .catch((err) => {
                        console.log('usr.update FakeERROR: ' + err);
                    })
    

                    /* if(!req.txnmessaging) await cpn.update({
                        units_useds: 'info.units_used',
                        status: 1
                    })
                    .catch((err) => {
                        console.log('cpn.update FakeERROR: ' + err);
                    })
                    .error((err) => {
                        console.log('cpn.update FakeERROR: ' + err);
                    }) */

    
                    //  LOG TRANSACTIONS (performance campaigns transactions are logged separately)
                    await models.Transaction.create({
                        description: 'DEBIT',
                        userIsd: ['user_id'],
                        types: (req.txnmessaging) ? 'TXN-MESSAGING' : ((req.perfcampaign) ? 'PERFCAMPAIGN' : 'CAMPAIGN'),
                        ref_id: (req.txnmessaging) ? new Date().getTime() : cpn.id.toString(),
                        units: (-1) * info.units_used,
                        status: 1,
                    })
                    .catch((err) => {
                        console.log('Transaction.create FakeERROR: ' + err);
                    })
                }

                //  CONVERT REFS FROM TEMP REFS TO REAL REFS
                if(!req.txnmessaging && !req.perfcampaign) await models.Tmpcampaign.update(
                    {
                        ref_campaignw: cpn.id.toString(),
                    }, {
                        where: {
                            ref_campaigna: "tmpref_" + info.id
                        }
                    }
                )
                .catch((err) => {
                    console.log('Tmpcampaign.update FakeERROR: ' + err);
                })

                //  REMOVE TEMPORARY DATA
                // if(!req.externalapi && !req.perfcampaign) await info.destroy();

                let mm = (schedule_) ? 'scheduled to be sent out at ' + moment(schedule_, 'YYYY-MM-DD HH:mm:ss').add(1, 'hour').format('h:mm A, DD-MMM-YYYY') + '.' : 'sent out.';
                
                _status = {
                    response: req.txnmessaging ? klist : "Success. Messages sent.", 
                    responseType: "OK", 
                    responseCode: "P001", 
                    responseText: (req.txnmessaging ? "" : "Campaign created successfully. ") + "Message(s) " + mm, 
                }


            } else if(networkerror && !req.txnmessaging) {

                await models.Message.destroy({
                    where: {
                        campaignIds: cpn.id.toString(),
                    }
                })
                .catch((err) => {
                    console.log('Tmpcampaign.update FakeERROR: ' + err);
                })
                // await cpn.destroy();

                _status = {
                    response: "Error: Campaign sending error!", 
                    responseType: "ERROR", 
                    responseCode: "E006", 
                    responseText: "An error occurred while sending out your Campaign. Kindly contact site admin.", 
                }
            } else if(!req.txnmessaging && !req.perfcampaign) {

                // await cpn.destroy();

                _status = {
                    response: "Error: Campaign sending error!", 
                    responseType: "ERROR", 
                    responseCode: "E007", 
                    responseText: "An error occurred while sending out your Campaign. Please try again later or contact admin.", 
                }
            } else {      //  transactional message
                _status = {
                    response: "Error: Transaction message sending error!", 
                    responseType: "ERROR", 
                    responseCode: "E008", 
                    responseText: "An error occurred while sending out your Transaction message. Please try again later or contact admin.", 
                }
            }
        } catch (err) {
            console.error('THIS ERROR: ' + err);
        }

        if(req.externalapi || req.perfcampaign) {
            return _status;
        } else {
            console.log('STATUS========= ' + JSON.stringify(_status));
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