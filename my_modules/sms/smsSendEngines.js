
const request = require('request');
var moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var models = require('../../models');
var phoneformat = require('../phoneformat');
var filelogger = require('../filelogger');
var env = require('../../config/env');
var _message = require('../output_messages');
var sendSMS = require('./sendSMS');
var networkerror = false;

var successfuls = 0;
var failures    = 0;

//  INFOBIP INIT
const { tracksend_user, tracksend_pwrd, tracksend_base_url } = require('../../config/cfg/infobip')();
var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

const kirusa = require('./platforms/kirusa');
const infobip = require('./platforms/infobip');
const messagebird = require('./platforms/messagebird');
const africastalking = require('./platforms/africastalking');

const smsSendEngine =  async (req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                              originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj) => {
    var file_not_logged = true;
    SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg
    var sms_service;        
    console.log('001~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
    if(req.externalapi) console.log('2~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
    
    try {
        if(aux_obj) {
            console.log('aux_obj', JSON.stringify(req.aux_obj));
            sms_service = aux_obj.sms_service;
        } else {
            console.log('req.user=', JSON.stringify(req.user));
            sms_service = req.user.sms_service;
        }
        console.log('001~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~sms_service = ', sms_service);

        if(sms_service == 'kirusa') {
            console.log('0011~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
            let resp = await kirusa.kirusaPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                  originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);

            console.log('returned: 0011~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~', JSON.stringify(resp));
            return resp;
        }

        if(sms_service == 'infobip') {
            return await infobip.infobipPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                    originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
        }

        if(sms_service == 'messagebird') {
            return await messagebird.messagebirdPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                            originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
        }

        if(sms_service == 'africastalking') {
            return await africastalking.africastalkingPlatform(req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                                                  originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj);
        }

    } catch(err) {
        console.log('%%%%%%%%%%%'+err);
        
        return { status: "error", msg: err };
    }
}

module.exports = smsSendEngine;
// export default smsSendEngine;
    