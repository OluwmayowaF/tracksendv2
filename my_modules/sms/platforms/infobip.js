//  INFOBIP INIT
var models = require('../../../models');
var phoneformat = require('../../phoneformat');
var filelogger = require('../../filelogger');
var env = require('../../../config/env');
var _message = require('../../output_messages');
var sendSMS = require('./../sendSMS');
const makeId = require('../../makeId');
const dbPostSMSSend = require('../dbPostSMSSend');

const { tracksend_user, tracksend_pwrd, tracksend_base_url } = require('../../../config/cfg/infobip')();
var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

exports.infobipPlatform = async (req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
  originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj) => {

    var q_tracking_type = !req.txnmessaging ? info.name.replace(/ /g, '_') : 'txn_sms_msg';
    var q_bulkId = 'generateBulk';
    var q_tracking_track = 'SMS';

    var m_from = sndr.name;
    var m_flash = false;
    var m_intermediateReport = true;
    // var m_notifyUrl = 'https://app.tracksend.co/api/sms/notify';
    var m_notifyUrl = env.SERVER_BASE + '/api/sms/infobip/notify';
    var m_notifyContentType = 'application/json';
    var m_validityPeriod = 24 * 60; //  24 hours
    var m_sendAt = schedule; //  24 hours

    var successfuls = 0;
    var failures    = 0;
    
    var file_not_logged = true;
    var networkerror = false;
    console.log('1~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
  
    SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg
  
    var k = 0;
    var msgarray = '';

    async function checkAndAggregate(kont) {
        k++;
        console.log('*******   Aggregating Contact #' + k + ':...    ********');
        let ctryid = kont.fields ? kont.fields.countryid : (kont.country ? kont.country.id : kont.countryId) ; // from perfcampaigns OR normal campaigns OR transactional msgs
        let formatted_phone = phoneformat(kont.phone, ctryid);
        if(!formatted_phone) return;
          
        // return new Promise(resolve => {

        async function getUniqueId() {

            do {

                var uid = makeId(3);
                var exists = await models.Message.findAll({
                    where: { 
                        ...(
                            (req.txnmessaging) ? {
                                shortlinkId: info.shortlinkId,
                            } : {
                                campaignId: cpn.id,
                            }
                        ),
                        contactlink: uid,
                    },
                })
                .error((r) => {
                    console.log("Error: Please try again later");
                })
                    // if(uid.length)
                
            } while (exists.length);
            console.log('UID = ' + uid);
            let shrtlnk = await models.Shortlink.findByPk(info.shortlinkId);
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~' + JSON.stringify(shrtlnk));
            
            if(!shrtlnk) throw 'shorturl';
            return {
                sid : shrtlnk.id,
                slk : shrtlnk.shorturl,
                cid: uid, 
            };
        }
        
        async function saveMsg(args) {
            let shrt;
            console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
            try {
                if(req.txnmessaging) {
                    shrt = await models.Message.create({
                        shortlinkId: args.sid,
                        contactlink: args.cid,
                        contactId: '00000',
                    });
                } else {
                    shrt = await cpn.createMessage({
                        shortlinkId: args.sid,
                        contactlink: args.cid,
                        contactId: kont._id.toString(),
                    });
                }

                console.log('MESSAGE ENTRY CREATE STARTED.');
                                                
                var updatedmessage  = originalmessage
                .replace(/\[firstname\]/g, kont.firstname)
                .replace(/\[first name\]/g, kont.firstname)
                .replace(/\[lastname\]/g, kont.lastname)
                .replace(/\[last name\]/g, kont.lastname)
                .replace(/\[email\]/g, kont.email)
                .replace(/\[e-mail\]/g, kont.email)
                .replace(/\[url\]/g, (args.slk && args.cid) ? 'http://tsn.pub/' + args.slk + '/' + args.cid : '')
                .replace(/\s{2,}/g, '')
                // .replace(/\\r/g, '')
                // .replace(/\\n/g, '')
                // .replace(/\\t/g, '')
                .replace(/&nbsp;/g, ' ');

                updatedmessage += (UNSUBMSG) ? _message('msg', 1091, ctryid, kont._id.toString()) : '';     //  add unsubscribe text
                updatedmessage += (DOSUBMSG) ? _message('msg', 1092, ctryid, kont._id.toString()) : '';     //  add subscribe text

                if(SINGLE_MSG) {
                    var msgto = {    //  STEP 0 OF MESSAGE CONSTRUCTION
                        "to": formatted_phone,
                        "messageId": shrt.id,
                    }
                    
                    console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                    return msgto;
                } else {
                    var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                        "from" : m_from,
                        "destinations" : [{
                            "to": formatted_phone,
                            "messageId": shrt.id,
                        }],
                        "text" : updatedmessage,
                        ...(
                            m_sendAt ? {
                                "sendAt" : m_sendAt,
                            } : {}
                        ),
                        "flash" : m_flash,
                        "intermediateReport" : m_intermediateReport,
                        "notifyUrl" : m_notifyUrl,
                        "notifyContentType" : m_notifyContentType,
                        "validityPeriod" : m_validityPeriod,
                    }; 
                    
                    console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
                    if(file_not_logged && !req.txnmessaging) {
                        filelogger('sms', 'Send Campaign (Infobip)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                        file_not_logged = false;
                    }    

                    return msgfull;
                }
            } catch(err) {
                console.log('________________________________');
                
                throw "111Error: Please try again later";
            }
                        
        }

        //create contact codes
        var args = {};

        if(!SINGLE_MSG && HAS_SURL) {
            console.log('GET UNIQUE ID!!!');
            
            args = await getUniqueId();
        }
        console.log('NEXT: Promise.all Done');
        
        return await saveMsg(args);
        console.log('1_____________________________');
        
        // })
    }

    //  loop through all the batches
    async function doLoop(start) { 
        let actions = [];

        console.log('**************   ' + 'count of contacts = ' + len + '; start = ' + start + '   ****************');
        if(start <= len) { 
            var end = (start + grpn > len) ? len : start + grpn;

            let sub_list = contacts.slice(start, end);
            var destinations = [];

            if(SINGLE_MSG) {
                console.log('SINGLE : ');
                
                for (let i = 0; i < sub_list.length; i++) {
                    destinations.push(await checkAndAggregate(sub_list[i]));
                }

                var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                    "from" : m_from,
                    "destinations" : destinations,
                    "text" : originalmessage,
                    ...(
                        m_sendAt ? {
                            "sendAt" : m_sendAt,
                        } : {}
                    ),
                    "flash" : m_flash,
                    "intermediateReport" : m_intermediateReport,
                    "notifyUrl" : m_notifyUrl,
                    "notifyContentType" : m_notifyContentType,
                    "validityPeriod" : m_validityPeriod,
                };
                console.log('=' + m_from + '..............MSGFULL...............: ' + JSON.stringify(sndr));

                console.log('SINGLE COMPILED!');
                if(file_not_logged && !req.txnmessaging) {
                    filelogger('sms', 'Send Campaign (Infobip)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                    file_not_logged = false;
                }

                actions.push(await Promise.resolve(msgfull));

            } else {
                console.log('NOT SINGLE OOOO');
                
                for (let i = 0; i < sub_list.length; i++) {
                    actions.push(await checkAndAggregate(sub_list[i]));
                }
                console.log('UNSINGLE COMPILED!');

            }

            console.log('1MSGS ARE: ' + JSON.stringify(actions));

            let data = await Promise.all(actions);

            console.log('2MSGS ARE: ' + JSON.stringify(data));
            
            var tosend = {
                "bulkId": (req.txnmessaging) ? 'TXNMSG-' + new Date().getTime().toString() : 'CMPGN-' + cpn.id + '-' + counter,
                "messages": data,
                "tracking": {
                    "track" : q_tracking_track,
                    "type" : q_tracking_type,
                }, 
            }

            const options = {
                url: 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                json: tosend,
                headers: {
                    'Authorization': 'Basic ' + base64encode,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
            
            let response = await sendSMS('infobip', options);
            // request.post(options, async (err, response) => {
            /* if (err){
                console.log('ERROR = ' + err);
                failures++;
            } else */ 
            if (response) {
                //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                console.log('Status: ' + response);
                // console.log('jStatus: ' + JSON.stringify(response));
                console.log('Status code: ' + JSON.stringify(response.code));
                
                if(response.code == "ENOTFOUND") networkerror = true;

                if(response.statusCode == 200 || response.status == 200) {
                    successfuls++;
                } else {
                    failures++;
                }
            }

            //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
            console.log('________________________INFO11='+ JSON.stringify(info));
            
            let resp = await dbPostSMSSend.dbPostSMSSend(req, res, batches, successfuls, failures, info, user_balance, user_id, cpn, schedule_, null, null, networkerror);
            console.log('a||||||||||||||||||||||||---' + JSON.stringify(resp));
            
            // });
            
            counter++;
            if(end < len) await doLoop(end)
            console.log('OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO');
            return resp;
        }

    }

    var start = 0;
    const MAX_NO_IF_NOT_SINGLE_MSGS     = 1000;   // FIXED FOR MESSAGEBIRD
    const MAX_NO_IF_SINGLE_MSGS         = 1000;   // FIXED FOR MESSAGEBIRD
    const GROUPING_NO_IF_SINGLE_MSGS    = 1000;   // FIXED FOR MESSAGEBIRD
    var grpn    = (SINGLE_MSG) ? Math.min(MAX_NO_IF_SINGLE_MSGS, GROUPING_NO_IF_SINGLE_MSGS) : MAX_NO_IF_NOT_SINGLE_MSGS;   //  MAXIMUM FOR MESSAGEBIRD = 50
    var len     = contacts.length;
    var counter = 1;
    var batches = Math.ceil(len/grpn);

    // var successfuls = 0;
    // var failures = 0;

    console.log('Start Looping...');
    let runall = await doLoop(0);
    console.log('@******************* ' + JSON.stringify(runall) + ' ***********************@');

    return runall;

    //  finally redirect back to page
    console.log('END... NEW PAGE!');
};
