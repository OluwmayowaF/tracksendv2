var models = require('../models');
// import { because } from './../models/User';
var moment = require('moment');
const request = require('request');
const {tracksend_user, tracksend_pwrd, tracksend_base_url} = require('../config/cfg/infobip')();

var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

exports.index = (req, res) => {
    var user_id = req.user.id;


    console.log('showing page...'); 
    
    
    Promise.all([
        models.Campaign.findAll({ 
            where: { 
                userId: user_id
            }, 
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Sender.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({
            where: { 
                userId: user_id
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Sender.count({
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({
            where: { 
                userId: user_id,
            }
        }), 
    ]).then(([cpns, sids, grps, csender, casender, ccontact]) => {
        // console.log('groups are: ' + JSON.stringify(sids));
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            flash: req.flash('success'),

            args: {
                cpns: cpns,
                sids: sids,
                grps: grps,
                nosenderids,
                noasenderids,
                nocontacts,
            }
        });
    });
};

exports.add = async (req, res) => {
    var user_id = req.user.id;
    var tempid = req.body.analysis_id;

    //  RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE
    var info = await models.Tmpcampaign.findByPk(tempid);
    if(!info) {
        console.log('INVALID OPERATION!');
        
        return;
    }

    //  GET USER BALANCE
    var user_balance = await models.User.findByPk(user_id, {
        attributes: ['balance'], 
        raw: true, 
    })
    
    console.log('USER BALANCE IS ' + JSON.stringify(user_balance));
    
    if(user_balance.balance < info.units_used) {
        console.log('INSUFFICIENT UNITS!');

        return;
    }
    
    console.log('form details are now...'); 

    console.log('form details are now: ' + JSON.stringify(info)); 

    var originalmessage  = info.message;
                            // .replace(/<span spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
                            // .replace(/<span spellcheck="false" contenteditable="false">url<\/span>/g, '[url]');
    // console.log('schedule is: ' + schedule);
    
    var schedule = (info.schedule) ? moment(parseInt(info.schedule)).format('YYYY-MM-DD HH:mm:ss') : null;
    console.log('schedule is: ' + schedule);
    
    //  create campaign
    models.Campaign.create({
        name: info.name,
        description: info.description,
        userId: user_id,
        senderId: info.senderId,
        shortlinkId: info.shortlinkId,
        message: originalmessage,
        schedule: schedule,
        recipients: info.recipients,
    })
    .then(async (cpn) => {
        //  bind campaign to group(s)   //  group | dnd | myshorturl
        var group = info.grp;
        var HAS_SURL = false;

        if (group !== 0) {
            await models.CampaignGroup.create({
                campaignId: cpn.id,
                groupId: group,
            })
            .error((err) => {
                console.log('2BIG ERROR: ' + err);
            })
        
            //  change status of shortlink to used
            if (info.shortlinkId) {
                HAS_SURL = true;
                await models.Shortlink.findByPk(info.shortlinkId)
                .then((shrt) => {
                    shrt.update({
                        shorturl: info.myshorturl,
                        status: 1
                    })
                })
                .error((err) => {
                    console.log('2BIG ERROR: ' + err);
                })
            }
            //  extract group contacts
            models.Group.findByPk(group)
            .then((grp) => {

                if(!grp) return;
                
                if(info.skip_dnd && info.skip_dnd == "on") {
                    var getconts = grp.getContacts({
                                            where: {
                                                status: 0
                                            }
                                        });
                } else {
                    var getconts = grp.getContacts();
                }

                /*  
                    DETERMINE IF SINGLE OR MULTIPLE MESSAGES
                    1.  Check if there's URL in msg
                    2.  Check if there's any personalization in msg
                */

                var SINGLE_MSG = false;
                
                var chk_message = originalmessage
                .replace(/\[firstname\]/g, 'X')
                .replace(/\[lastname\]/g, 'X')
                .replace(/\[email\]/g, 'X')
                .replace(/\[url\]/g, 'X');

                if(chk_message == originalmessage) {
                    SINGLE_MSG = true;
                }

                /*  
                    DETERMINE IF THERE'S SHORT URL
                */

                                                            


                getconts.then(async (contacts) => {
    
                    var q_bulkId = 'generateBulk';
                    var q_tracking_track = 'SMS';
                    var q_tracking_type = info.name.replace(/ /g, '_');

                    var m_from = 'FROM';
                    var m_flash = false;
                    var m_intermediateReport = true;
                    var m_notifyUrl = 'https://tracksend/sms/campaign/notify';
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
                                        contactlink: uid,
                                    },
                                })
                                .error((r) => {
                                    console.log("Error: Please try again later");
                                })
                                    // if(uid.length)
                                
                            } while (exists.length);
                            console.log('UID = ' + uid);
                            
                            return {
                                sid : info.shortlinkId,
                                cid: uid, 
                            };
                        }
                        
                        function saveMsg(args) {
                            return cpn.createMessage({
                                shortlinkId: args.sid,
                                contactlink: args.cid,
                            })
                            .then((shrt) => {
                                console.log('MESSAGE ENTRY CREATE STARTED.');
                                                                
                                var updatedmessage  = originalmessage
                                .replace(/\[firstname\]/g, kont.firstname)
                                .replace(/\[lastname\]/g, kont.lastname)
                                .replace(/\[email\]/g, kont.email)
                                .replace(/\[url\]/g, 'https://tsn.go/' + args.sid + '/' + args.cid)
                                .replace(/&nbsp;/g, ' ');
    
                                if(SINGLE_MSG) {
                                    var msgto = {
                                        "to": kont.countryId + kont.phone.substr(1),
                                        "messageId": shrt.id,
                                    }
                                    
                                    console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                                    return msgto;
                                } else {
                                    var msgfull = {
                                        "from" : m_from,
                                        "destinations" : [{
                                            "to": kont.countryId + kont.phone.substr(1),
                                            "messageId": shrt.id,
                                        }],
                                        "text" : updatedmessage,
                                        "sendAt" : m_sendAt,
                                        "flash" : m_flash,
                                        "intermediateReport" : m_intermediateReport,
                                        "notifyUrl" : m_notifyUrl,
                                        "notifyContentType" : m_notifyContentType,
                                        "validityPeriod" : m_validityPeriod,
                                    };
                                    
                                    console.log('UNSINGLE MESSAGE ENTRY CREATE DONE.');
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
                                    destinations.push(await checkAndAggregate(sub_list[i]));
                                }

                                var msgfull = {
                                    "from" : m_from,
                                    "destinations" : destinations,
                                    "text" : originalmessage,
                                    "sendAt" : m_sendAt,
                                    "flash" : m_flash,
                                    "intermediateReport" : m_intermediateReport,
                                    "notifyUrl" : m_notifyUrl,
                                    "notifyContentType" : m_notifyContentType,
                                    "validityPeriod" : m_validityPeriod,
                                };
                                console.log('SINGLE COMPILED!');
                                
                                actions.push(await Promise.resolve(msgfull));

                            } else {
                                console.log('NOT SINGLE OOOO');
                                
                                for (let i = 0; i < sub_list.length; i++) {
                                    actions.push(await checkAndAggregate(sub_list[i]));
                                }
                                console.log('UNSINGLE COMPILED!');

                            }

                            Promise.all(actions)
                            .then(async (data) => {
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
                                
                                request.post(options,(err, response) => {
                                    if (err){
                                        console.log('ERROR = ' + err);
                                        failures++;
                                    } else {
                                        //   console.log(`Status code: ${response.statusCode}. Message: ${response.body}`);
                                        console.log('Status code: ' + response.statusCode + '; Message: ' + JSON.stringify(response.body));

                                        if(response.statusCode == 200) {
                                            successfuls++;
                                        }
                                    }

                                    //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
                                    if((successfuls + failures) == batches) {
                                        console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures);

                                        let new_bal = parseFloat(user_balance.balance) - parseFloat(info.units_used);
                                        console.log('old bal = ' + user_balance.balance + '; units used = ' + info.units_used + '; NEW BALANCE = ' + new_bal);
                                        
                                        models.User.findByPk(user_id)
                                        .then((usr) => { 
                                            return usr.update({
                                                balance: new_bal,
                                            })
                                        })
                                        //  UPDATE UNITS USED FOR CAMPAIGN
                                        .then(() => {
                                            return cpn.update({
                                                units_used: info.units_used,
                                            })
                                        })
                                        //  REMOVE TEMPORARY DATA
                                        .then(() => {
                                            return info.destroy()
                                            .then(() => {
                                                console.log('TEMP DELETED!');
                    
                                                req.flash('success', 'Campaign created successfully. Messages sent out.');
                                                var backURL = req.header('Referer') || '/';
                                                res.redirect(backURL);
                                            })
                                        })
                                        .error((err) => {
                                            console.log('THIS ERROR: ' + err);
                    
                                            req.flash('error', 'Campaign created, but an error occured');
                                            var backURL = req.header('Referer') || '/';
                                            res.redirect(backURL);
                                        })
                                    }
                                });
                        
                        



                                console.log(JSON.stringify(tosend));
                                counter++;
                                if(end < len) await doLoop(end)
                            })
                        }
                    }

                    var start = 0;
                    var grpn = 3;
                    var len = contacts.length;
                    var counter = 1;
                    var batches = Math.ceil(len/grpn);
         
                    var successfuls = 0;
                    var failures = 0;
           
                    console.log('Start Looping...');
                    await doLoop(0);
                    
                    //  finally redirect back to page
                    console.log('END... NEW PAGE!');

                });
                
            })
            .error((err) => {
                console.log('BIG ERROR: ' + err);
            })
        }

    })
    .error((err) => {
        console.log('BIG BIG ERROR: ' + err);
    })

    return;

	function makeId(length) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
			 result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

}
