
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

//  INFOBIP INIT
const { tracksend_user, tracksend_pwrd, tracksend_base_url } = require('../../config/cfg/infobip')();
var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

//  AFRICA'S TALKING INIT
const africastalkingOptions = require('../../config/cfg/africastalking');
var africastalking = require('africastalking')(africastalkingOptions);


const smsSendEngine =  async (req, res, user_id, user_balance, sndr, info, contacts, schedule, schedule_, cpn, 
                              originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, aux_obj) => {
    var file_not_logged = true;
    SINGLE_MSG = SINGLE_MSG && !UNSUBMSG && !DOSUBMSG;    //  UNSUBMSG includes individual contact ids so invariable can't be single msg
    var sms_service;        
    console.log('1~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
    if(req.externalapi) console.log('2~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~  ~~~~~~~~~~~~~');
    
    try {
        if(aux_obj) {
            sms_service = aux_obj.sms_service;
        } else {
            sms_service = req.user.sms_service;
        }

        if(sms_service == 'ku') {
            return await (async function() {

                var q_tracking_type = info.name.replace(/ /g, '_');
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

                var k = 0;
                var msgarray = '';

                async function checkAndAggregate(kont) {
                    k++;
                    console.log('*******   Aggregating Contact #' + k + ':...    ********');
                    
                    // return new Promise(resolve => {

                    async function getUniqueId() {

                        do {

                            var uid = makeId(3);
                            var exists = await models.Message.findAll({
                                where: { 
                                    campaignId: cpn.id,
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
                        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
                        try {
                            let shrt = await cpn.createMessage({
                                shortlinkId: args.sid,
                                contactlink: args.cid,
                                contactId: kont.id,
                            });

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

                            updatedmessage += (UNSUBMSG) ? _message('msg', 1091, kont.countryId, kont.id) : '';     //  add unsubscribe text
                            updatedmessage += (DOSUBMSG) ? _message('msg', 1092, kont.countryId, kont.id) : '';     //  add subscribe text

                            if(SINGLE_MSG) {
                                var msgto = {    //  STEP 0 OF MESSAGE CONSTRUCTION
                                    "to": phoneformat(kont.phone, kont.countryId),
                                    "messageId": shrt.id,
                                }
                                
                                console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                                return msgto;
                            } else {
                                var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                    "from" : m_from,
                                    "destinations" : [{
                                        "to": phoneformat(kont.phone, kont.countryId),
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
                                if(file_not_logged) {
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
                            console.log('SINGLE COMPILED!');
                            if(file_not_logged) {
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

                        let data = await Promise.all(actions);

                        console.log('MSGS ARE: ' + JSON.stringify(data));
                        
                        var tosend = {
                            "bulkId": 'CMPGN-' + cpn.id + '-' + counter,
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
                        
                        let resp = await dbPostSMSSend(req, res, successfuls, failures, batches, info, user_balance, user_id, cpn, schedule_);
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

                var successfuls = 0;
                var failures = 0;

                console.log('Start Looping...');
                let runall = await doLoop(0);
                console.log('@******************* ' + JSON.stringify(runall) + ' ***********************@');

                return runall;

                //  finally redirect back to page
                console.log('END... NEW PAGE!');
            })()
            console.log('|||||||||||||||||||||||||||||||||||||||||||||||||||||');
            
        }

        if(sms_service == 'infobip') {
            return await (async function() {

                var q_tracking_type = info.name.replace(/ /g, '_');
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

                var k = 0;
                var msgarray = '';

                async function checkAndAggregate(kont) {
                    k++;
                    console.log('*******   Aggregating Contact #' + k + ':...    ********');
                    
                    // return new Promise(resolve => {

                    async function getUniqueId() {

                        do {

                            var uid = makeId(3);
                            var exists = await models.Message.findAll({
                                where: { 
                                    campaignId: cpn.id,
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
                        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
                        try {
                            let shrt = await cpn.createMessage({
                                shortlinkId: args.sid,
                                contactlink: args.cid,
                                contactId: kont.id,
                            });

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

                            updatedmessage += (UNSUBMSG) ? _message('msg', 1091, kont.countryId, kont.id) : '';     //  add unsubscribe text
                            updatedmessage += (DOSUBMSG) ? _message('msg', 1092, kont.countryId, kont.id) : '';     //  add subscribe text

                            if(SINGLE_MSG) {
                                var msgto = {    //  STEP 0 OF MESSAGE CONSTRUCTION
                                    "to": phoneformat(kont.phone, kont.countryId),
                                    "messageId": shrt.id,
                                }
                                
                                console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                                return msgto;
                            } else {
                                var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                    "from" : m_from,
                                    "destinations" : [{
                                        "to": phoneformat(kont.phone, kont.countryId),
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
                                if(file_not_logged) {
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
                            console.log('SINGLE COMPILED!');
                            if(file_not_logged) {
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

                        let data = await Promise.all(actions);

                        console.log('MSGS ARE: ' + JSON.stringify(data));
                        
                        var tosend = {
                            "bulkId": 'CMPGN-' + cpn.id + '-' + counter,
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
                        
                        let resp = await dbPostSMSSend(req, res, successfuls, failures, batches, info, user_balance, user_id, cpn, schedule_);
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

                var successfuls = 0;
                var failures = 0;

                console.log('Start Looping...');
                let runall = await doLoop(0);
                console.log('@******************* ' + JSON.stringify(runall) + ' ***********************@');

                return runall;

                //  finally redirect back to page
                console.log('END... NEW PAGE!');
            })()
            console.log('|||||||||||||||||||||||||||||||||||||||||||||||||||||');
            
        }

        if(sms_service == 'messagebird') {
            (async function() {

                //  MAXIMUM OF FIFTY (50) RECIPIENTS PER REQUEST :(

                /* var params = {
                    'originator': 'MessageBird',
                    'recipients': [
                        '31612345678',
                        '31612345678',
                        '31612345678',
                    ],
                    'scheduledDatetime' : '2016-04-29T09:42:26+00:00',
                    'reportUrl'         : 'https://dev2.tracksend.co/api/sms/notify',    //  should actually/instead be set in account
                    'reference'         : 'my_badass_campaign',
                    'mclass'            : 1,        //  i.e. 'normal message' (can be ommitted)
                    'type'              : 'sms',    //   (can be ommitted)
                    'body'              : 'Hello, world!'
                };
                
                messagebird.messages.create(params, function (err, response) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(response);
                }); */


                var q_reference = info.name.replace(/ /g, '_');
                var q_type = 'sms';

        console.log('+++++++++++++++++++ env = '+ env.SERVER_BASE);

                var m_originator = sndr.name;
                // var m_reportUrl = 'https://dev2.tracksend.co/api/sms/notify/';
                var m_reportUrl = env.SERVER_BASE + '/api/sms/messagebird/notify/';
                var m_validity = 2 * 24 * 60 * 60; //  48 hours ...in seconds
                var m_scheduledDatetime = schedule; //  24 hours
                var m_mclass = 1; 

                var k = 0;
                var msgarray = '';

                async function messagebird_checkAndAggregate(kont) {
                    k++;
                    console.log('*******   Aggregating Contact #' + k + ':...    ********');
                    
                    // return new Promise(resolve => {

                    async function getUniqueId() {

                        do {

                            var uid = makeId(3);
                            var exists = await models.Message.findAll({
                                where: { 
                                    campaignId: cpn.id,
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
                        return {
                            sid : shrtlnk.id,
                            slk : shrtlnk.shorturl,
                            cid: uid, 
                        };
                    }
                    
                    function saveMsg(args) {
                        return cpn.createMessage({
                            shortlinkId: args.sid,
                            contactlink: args.cid,
                            contactId: kont.id,
                        })
                        .then((shrt) => {
                            console.log('MESSAGE ENTRY CREATE STARTED.:::' + JSON.stringify(shrt));
                                                            
                            var updatedmessage  = originalmessage
                            .replace(/\[firstname\]/g, kont.firstname)
                            .replace(/\[first name\]/g, kont.firstname)
                            .replace(/\[lastname\]/g, kont.lastname)
                            .replace(/\[last name\]/g, kont.lastname)
                            .replace(/\[email\]/g, kont.email)
                            .replace(/\[e-mail\]/g, kont.email)
                            .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
                            .replace(/\s{2,}/g, '')
                            // .replace(/\\r/g, '')
                            // .replace(/\\n/g, '')
                            // .replace(/\\t/g, '')
                            .replace(/&nbsp;/g, ' ');

                            updatedmessage += (UNSUBMSG) ? _message('msg', 1091, kont.countryId, kont.id) : '';     //  add unsubscribe text
                            updatedmessage += (DOSUBMSG) ? _message('msg', 1092, kont.countryId, kont.id) : '';     //  add unsubscribe text

                            console.log('====================================');
                            console.log('UNSUB MSG IS:::' + _message('msg', 1091, kont.countryId, kont.id));
                            console.log('====================================');
                            
                            if(SINGLE_MSG) {
                                var msgto = "+" + phoneformat(kont.phone, kont.countryId);
                                
                                console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                                return msgto;
                            } else {
                                var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                    "originator" : m_originator,
                                    "recipients" : ["+" + phoneformat(kont.phone, kont.countryId)],
                                    "body" : updatedmessage,
                                    ...(
                                        m_scheduledDatetime ? {
                                            "scheduledDatetime" : m_scheduledDatetime,
                                        } : {}
                                    ),
                                    "type"      : q_type,
                                    "mclass"    : m_mclass,
                                    "reference" : q_reference + " " + shrt.id,
                                    "reportUrl" : m_reportUrl,
                                    "validity"  : m_validity
                                }; 
                                
                                console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
                                if(file_not_logged) {
                                    filelogger('sms', 'Send Campaign (MessageBird)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                                    file_not_logged = false;
                                }    
                            
                                return msgfull;
                            }
                            
                        })
                        .error((r) => {
                            console.log("Error: Please try again later");
                        })
                                    
                    }

                    //create contact codes
                    var args = {};

                    if(!SINGLE_MSG && HAS_SURL) {
                        console.log('GET UNIQUE ID!!!');
                        
                        args = await getUniqueId();
                    }
                    console.log('NEXT: Promise.all Done');
                    
                    return await saveMsg(args);

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
                                destinations.push(await messagebird_checkAndAggregate(sub_list[i]));
                            }

                            var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                "originator" : m_originator,
                                "recipients" : destinations,
                                "body" : originalmessage,
                                ...(
                                    m_scheduledDatetime ? {
                                        "scheduledDatetime" : m_scheduledDatetime,
                                    } : {}
                                ),
                                "type"      : q_type,
                                "mclass"    : m_mclass,
                                "reference" : q_reference,
                                "reportUrl" : m_reportUrl,
                                "validity"  : m_validity
                            }; 

                            console.log('SINGLE COMPILED!');
                            if(file_not_logged) {
                                filelogger('sms', 'Send Campaign (MessageBird)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                                file_not_logged = false;
                            }    
                            
                            actions.push(await Promise.resolve(msgfull));

                        } else {
                            console.log('NOT SINGLE OOOO');
                            
                            for (let i = 0; i < sub_list.length; i++) {
                                actions.push(await messagebird_checkAndAggregate(sub_list[i]));
                            }
                            console.log('UNSINGLE COMPILED!');

                        }

                        Promise.all(actions)
                        .then(async (data) => {
                            console.log('MSGS ARE: ' + JSON.stringify(data[0]));
                            
                            let params = data[0];

                            let response = await sendSMS('messagebird', params);

                            let err;
                            console.log('********' + JSON.stringify(response));
                            
                            // await messagebird.messages.create(params, async function (err, response) {
                            let resp_ = null;
                            if (err) {
                                console.log('ERROR = ' + err);
                                failures++;
                            } else {
                                console.log(response);
                                //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                                response.recipients.items.id = response.id;
                                
                                if(response.id) {
                                    resp_ = response.id;
                                    successfuls++;
                                } else {
                                    failures++;
                                }
                                console.log('mITEMS: ' + JSON.stringify(response.recipients.items) + '; Message(s) ID: ' + JSON.stringify(response.id));
                            }

                            //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
                            let klist = sub_list.map(k => { return k.id })
                            await dbPostSMSSend(req, res, successfuls, failures, batches, info, user_balance, user_id, cpn, schedule_, klist, resp_);
                            // });

                            /* const options = {
                                url: 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                                json: tosend,
                                headers: {
                                    'Authorization': 'Basic ' + base64encode,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            } 
                            
                            request.post(options, async (err, response) => {
                                if (err){
                                    console.log('ERROR = ' + err);
                                    failures++;
                                } else {
                                    //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                                    console.log('Status code: ' + response.statusCode + '; Message: ' + JSON.stringify(response.body));

                                    if(response.statusCode == 200) {
                                        successfuls++;
                                    } else {
                                        failures++;
                                    }
                                }
                            }); */
                    
                    
                            console.log(JSON.stringify(params));
                            counter++;
                            if(end < len) await doLoop(end)
                        })
                    }

                }

                const MAX_NO_IF_NOT_SINGLE_MSGS     = 1;    // FIXED FOR MESSAGEBIRD
                const MAX_NO_IF_SINGLE_MSGS         = 50;   // FIXED FOR MESSAGEBIRD
                const GROUPING_NO_IF_SINGLE_MSGS    = 3;   // FIXED FOR MESSAGEBIRD
                var grpn    = (SINGLE_MSG) ? Math.min(MAX_NO_IF_SINGLE_MSGS, GROUPING_NO_IF_SINGLE_MSGS) : MAX_NO_IF_NOT_SINGLE_MSGS;   //  MAXIMUM FOR MESSAGEBIRD = 50
                var start = 0;
                var len     = contacts.length;
                var counter = 1;
                var batches = Math.ceil(len/grpn);

                var successfuls = 0;
                var failures    = 0;

                console.log('Start Looping...');
                let runall = await doLoop(0);
                return runall;

                //  finally redirect back to page
                console.log('END... NEW PAGE!');
            })()
        }

        if(sms_service == 'africastalking') {
            (async function() {

                //  MAXIMUM OF FIFTY (50) RECIPIENTS PER REQUEST :(

                // const sms = africastalking.SMS;

                // var q_reference = info.name.replace(/ /g, '_');
                // var q_type = 'sms';

                var m_name = africastalkingOptions.username;
                var m_from = sndr.name;
                // var m_reportUrl = env.SERVER_BASE + '/api/sms/africastalking/notify/';
                // var m_validity = 2 * 24 * 60 * 60; //  48 hours ...in seconds
                // var m_scheduledDatetime = schedule; //  24 hours
                // var m_mclass = 1; 

                var k = 0;
                var msgarray = '';

                async function africastalking_checkAndAggregate(kont) {
                    k++;
                    console.log('*******   Aggregating Contact #' + k + ':...    ********');
                    
                    // return new Promise(resolve => {

                    async function getUniqueId() {

                        do {

                            var uid = makeId(3);
                            var exists = await models.Message.findAll({
                                where: { 
                                    campaignId: cpn.id,
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
                        return {
                            sid : shrtlnk.id,
                            slk : shrtlnk.shorturl,
                            cid: uid, 
                        };
                    }
                    
                    function saveMsg(args) {
                        return cpn.createMessage({
                            shortlinkId: args.sid,
                            contactlink: args.cid,
                            contactId:   kont.id,
                            destination: "+" + phoneformat(kont.phone, kont.countryId),
                        })
                        .then((shrt) => {
                            console.log('MESSAGE ENTRY CREATE STARTED.:::' + JSON.stringify(shrt));
                                                            
                            var updatedmessage  = originalmessage
                            .replace(/\[firstname\]/g, kont.firstname)
                            .replace(/\[first name\]/g, kont.firstname)
                            .replace(/\[lastname\]/g, kont.lastname)
                            .replace(/\[last name\]/g, kont.lastname)
                            .replace(/\[email\]/g, kont.email)
                            .replace(/\[e-mail\]/g, kont.email)
                            .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
                            .replace(/\s{2,}/g, '')
                            // .replace(/\\r/g, '')
                            // .replace(/\\n/g, '')
                            // .replace(/\\t/g, '')
                            .replace(/&nbsp;/g, ' ');

                            updatedmessage += (UNSUBMSG) ? _message('msg', 1091, kont.countryId, kont.id) : '';     //  add unsubscribe text
                            updatedmessage += (DOSUBMSG) ? _message('msg', 1092, kont.countryId, kont.id) : '';     //  add unsubscribe text

                            console.log('====================================');
                            console.log('UNSUB MSG IS:::' + _message('msg', 1091, kont.countryId, kont.id));
                            console.log('====================================');
                            
                            if(SINGLE_MSG) {
                                var msgto = "+" + phoneformat(kont.phone, kont.countryId);
                                
                                console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                                return msgto;
                            } else {
                                var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                    "from" : m_from,
                                    "to" : ["+" + phoneformat(kont.phone, kont.countryId)],
                                    "message" : updatedmessage,
                                }; 
                                
                                console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
                                if(file_not_logged) {
                                    filelogger('sms', 'Send Campaign (AfricasTalking)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                                    file_not_logged = false;
                                }    
                            
                                return msgfull;
                            }
                        })
                        .error((r) => {
                            console.log("Error: Please try again later");
                        })
                                    
                    }

                    //create contact codes
                    var args = {};

                    if(!SINGLE_MSG && HAS_SURL) {
                        console.log('GET UNIQUE ID!!!');
                        
                        args = await getUniqueId();
                    }
                    console.log('NEXT: Promise.all Done');
                    
                    return await saveMsg(args);

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
                                destinations.push(await africastalking_checkAndAggregate(sub_list[i]));
                            }

                            var msgfull = { //  STEP 1 OF MESSAGE CONSTRUCTION
                                "username" : m_name,
                                "from" : m_from,
                                "to" : destinations,
                                "message" : originalmessage,
                            }; 

                            
                            console.log('SINGLE COMPILED!');
                            if(file_not_logged) {
                                filelogger('sms', 'Send Campaign (AfricasTalking)', 'sending campaign: ' + cpn.name, JSON.stringify(msgfull));
                                file_not_logged = false;
                            }    
                            
                            actions.push(await Promise.resolve(msgfull));

                        } else {
                            console.log('NOT SINGLE OOOO');
                            
                            for (let i = 0; i < sub_list.length; i++) {
                                actions.push(await africastalking_checkAndAggregate(sub_list[i]));
                            }
                            console.log('UNSINGLE COMPILED!');

                        }

                        Promise.all(actions)
                        .then(async (data) => {
                            console.log('MSGS ARE: ' + JSON.stringify(data));
                            
                            let params = data[0];

                            let response = await sendSMS('africastalking', params);
                            // let resp_ = null;
                            let resp_ = response;
                            console.log(JSON.stringify(response));
                            // return;

                            //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
                            let klist = sub_list.map(k => { return k.id })
                            await dbPostSMSSend(req, res, successfuls, failures, batches, info, user_balance, user_id, cpn, schedule_, klist, resp_);

                            /* const options = {
                                url: 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                                json: tosend,
                                headers: {
                                    'Authorization': 'Basic ' + base64encode,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            } 
                            
                            request.post(options, async (err, response) => {
                                if (err){
                                    console.log('ERROR = ' + err);
                                    failures++;
                                } else {
                                    //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                                    console.log('Status code: ' + response.statusCode + '; Message: ' + JSON.stringify(response.body));

                                    if(response.statusCode == 200) {
                                        successfuls++;
                                    } else {
                                        failures++;
                                    }
                                }
                            }); */
                    
                    
                            console.log(JSON.stringify(params));
                            counter++;
                            if(end < len) await doLoop(end)
                        })
                    }

                }

                const MAX_NO_IF_NOT_SINGLE_MSGS     = 1;    // FIXED FOR MESSAGEBIRD
                const MAX_NO_IF_SINGLE_MSGS         = 50;   // FIXED FOR MESSAGEBIRD
                const GROUPING_NO_IF_SINGLE_MSGS    = 3;   // FIXED FOR MESSAGEBIRD
                var grpn    = (SINGLE_MSG) ? Math.min(MAX_NO_IF_SINGLE_MSGS, GROUPING_NO_IF_SINGLE_MSGS) : MAX_NO_IF_NOT_SINGLE_MSGS;   //  MAXIMUM FOR MESSAGEBIRD = 50
                var start = 0;
                var len     = contacts.length;
                var counter = 1;
                var batches = len;  //  Math.ceil(len/grpn);    //  afriksatalking has unique difference in successfuls + failures == batched?

                var successfuls = 0;
                var failures    = 0;

                console.log('Start Looping...');
                let runall = await doLoop(0);
                return runall;

                //  finally redirect back to page
                console.log('END... NEW PAGE!');
            })()
        }

    } catch(err) {
        console.log('%%%%%%%%%%%'+err);
        
        return { status: "error", msg: err };
    }
}

function makeId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function dbPostSMSSend(req, res, successfuls, failures, batches, info, user_balance, user_id, cpn, schedule_, klist = null, response = null) {
    //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
    console.log('dbPostSMSSend -- 11');
    
    if(response) {
        console.log('dbPostSMSSend -- 22');
        //  update message with id after success
        if(response.SMSMessageData) {   //  afrikastalking response
            console.log('let recps = response.SMSMessageData.Recipients');
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


    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = smsSendEngine;
// export default smsSendEngine;
    