var models = require('../models');
// import { because } from './../models/User';
var moment = require('moment');
const request = require('request');
const {tracksend_user, tracksend_pwrd, tracksend_base_url} = require('../config/cfg/infobip')();
const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const Op = Sequelize.Op;
var { getWhatsAppStatus } = require('../my_modules/whatsappHandlers')();
var phoneformat = require('../my_modules/phoneformat');

var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

exports.index = (req, res) => {
    var user_id = req.user.id;
    
    console.log('showing page...' + JSON.stringify(req.user)); 
        
    Promise.all([
        sequelize.query(
            "SELECT campaigns.id, campaigns.name, campaigns.units_used, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, IF(status = 1, 'Active', 'Error') AS status, campaigns.createdAt " +
            "FROM campaigns " +
            "LEFT OUTER JOIN campaign_groups ON campaign_groups.campaignId = campaigns.id " +
            "LEFT OUTER JOIN groups ON groups.id = campaign_groups.groupId " +
            "WHERE campaigns.userId = :uid " +
            "GROUP BY campaigns.id " +
            "ORDER BY campaigns.createdAt DESC ", {
                replacements: {
                    uid: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ), 
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Group.findAll({      //  get only the uncategorized group
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        }),
        models.Sender.count({       //  get count of sender ids
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({       //  get count of "active" sender ids
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({      //  get count of contacts
            where: { 
                userId: user_id,
            }
        }), 
        models.Shortlink.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [    
                // ['status', 'DESC'],
                ['createdAt', 'DESC']
            ]
        }),    
    ]).then(async ([cpns, sids, grps, non, csender, casender, ccontact, shorturl]) => {
        var ngrp = non[0].id;

        console.log('====================================');
        console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        console.log('====================================');
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        let status = await getWhatsAppStatus(user_id);
        await models.User.update(
            {
                wa_active: status.active ? 1 : 0,
            },
            {
                where: {
                    id: user_id,
                }
            }
        )

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            campaign_type: '',
            has_whatsapp: status.active,
            flashtype, flash,

            args: {
                cpns,
                sids,
                grps,
                ngrp,
                nosenderids,
                noasenderids,
                nocontacts,
                shorturl,
            }
        });
    });
};

exports.smsindex = (req, res) => {
    var user_id = req.user.id;


    console.log('showing page...'); 
        
    Promise.all([
        sequelize.query(
            "SELECT campaigns.id, campaigns.name, campaigns.units_used, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, IF(status = 1, 'Active', 'Error') AS status, campaigns.createdAt " +
            "FROM campaigns " +
            "LEFT OUTER JOIN campaign_groups ON campaign_groups.campaignId = campaigns.id " +
            "LEFT OUTER JOIN groups ON groups.id = campaign_groups.groupId " +
            "WHERE campaigns.userId = :uid AND campaigns.mediatypeId = 1 " +
            "GROUP BY campaigns.id " +
            "ORDER BY campaigns.createdAt DESC ", {
                replacements: {
                    uid: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ), 
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Group.findAll({      //  get only the uncategorized group
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        }),
        models.Sender.count({       //  get count of sender ids
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({       //  get count of "active" sender ids
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({      //  get count of contacts
            where: { 
                userId: user_id,
            }
        }), 
        models.Shortlink.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [    
                // ['status', 'DESC'],
                ['createdAt', 'DESC']
            ]
        }),    
    ]).then(([cpns, sids, grps, non, csender, casender, ccontact, shorturl]) => {
        var ngrp = non[0].id;

        console.log('====================================');
        console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        console.log('====================================');
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            campaign_type: "SMS",
            flashtype, flash,

            args: {
                cpns,
                sids,
                grps,
                ngrp,
                nosenderids,
                noasenderids,
                nocontacts,
                shorturl,
            }
        });
    });
};

exports.waindex = (req, res) => {
    var user_id = req.user.id;


    console.log('showing page...'); 
        
    Promise.all([
        sequelize.query(
            "SELECT campaigns.id, campaigns.name, campaigns.units_used, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, IF(status = 1, 'Active', 'Error') AS status, campaigns.createdAt " +
            "FROM campaigns " +
            "LEFT OUTER JOIN campaign_groups ON campaign_groups.campaignId = campaigns.id " +
            "LEFT OUTER JOIN groups ON groups.id = campaign_groups.groupId " +
            "WHERE campaigns.userId = :uid AND campaigns.mediatypeId = 2 " +
            "GROUP BY campaigns.id " +
            "ORDER BY campaigns.createdAt DESC ", {
                replacements: {
                    uid: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ),/*  
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),  */
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                },
                mediatypeId: 2
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Group.findAll({      //  get only the uncategorized group
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
            mediatypeId: 2
        }),
        models.Shortlink.findAll({ 
            where: { 
                userId: user_id,
                status: 1
            },
            order: [    
                // ['status', 'DESC'],
                ['createdAt', 'DESC']
            ]
        }),    
    ]).then(([cpns, grps, non, shorturl]) => {
        var ngrp = non[0].id;

        // console.log('====================================');
        // console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        // console.log('====================================');
        // if(!csender) var nosenderids = true; else var nosenderids = false;
        // if(!casender) var noasenderids = true; else var noasenderids = false;
        // if(!ccontact) var nocontacts = true; else var nocontacts = false;

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            campaign_type: "WhatsApp",
            flashtype, flash,

            args: {
                cpns,
                grps,
                ngrp,
                shorturl,
            }
        });
    });
};

exports.add = async (req, res) => {
    var user_id = req.user.id;
    var tempid = req.body.analysis_id;

    //  RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE
    var info = await models.Tmpcampaign.findByPk(tempid);

    if(req.body.type == "whatsapp") {
        doWhatsApp();

        return;
    } else if(!info) {
        console.log('INVALID OPERATION!');
        
        return;
    }
    //  ...continues here if type-sms and has been analysed
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

    var originalmessage  = info.message.replace(/[^\x00-\x7F]/g, "");
                            // .replace(/<span spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
                            // .replace(/<span spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
                            // .replace(/<span spellcheck="false" contenteditable="false">url<\/span>/g, '[url]');
    // console.log('schedule is: ' + schedule);
    
    var schedule_ = (info.schedule) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : null;  //  for DB
    var schedule = (info.schedule) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.000Z') : null;   //  for infobip
    
    //  create campaign
    Promise.all([models.Campaign.create({
        name: info.name,
        description: info.description,
        userId: user_id,
        senderId: info.senderId,
        shortlinkId: info.shortlinkId,
        message: originalmessage,
        schedule: schedule_,
        recipients: info.recipients,
        has_utm: info.has_utm,
        }),
        models.Sender.findByPk(info.senderId)
    ])
    .then(async ([cpn, sndr]) => {
        //  bind campaign to group(s)   //  group | dnd | myshorturl
        // var group = info.grp;
        
        var HAS_SURL = false;
        console.log('info.grp = ' + info.grp);
        
        var groups = JSON.parse(info.grp);
        console.log('info.group = ' + groups + '; json = ' + JSON.stringify(groups));
        var skip = (info.skip_dnd && info.skip_dnd == "on");
    
        if (groups !== 0) {

            var dd = await models.Group.findAll({
                include: [{
                    model: models.Contact, 
                    ...(
                        skip ? {
                            where: {
                                [Sequelize.Op.and]: [
                                    {
                                        status: {
                                            [Sequelize.Op.ne] : 2
                                        }
                                    },
                                    {
                                        status: {
                                            [Sequelize.Op.ne] : 3
                                        }
                                    }
                                ]
                            }
                        } : {}
                        )
                }],
                where: {
                    id: {
                        [Op.in]: groups,
                    },
                    userId: req.user.id,
                },
            })

            //  merge contacts from all groups

            var arr = [];
            dd.forEach((el) => {
                arr = arr.concat(el.contacts);

                models.CampaignGroup.create({
                    campaignId: cpn.id,
                    groupId: el.id,
                })
                .error((err) => {
                    console.log('2BIG ERROR: ' + err);
                })
            });

            //  remove duplicates
            var contacts = _.uniqBy(arr, 'phone');

            //  start processing...
            
            //  change status of shortlink to used
            if (info.shortlinkId) {
                HAS_SURL = true;
                /* await models.Shortlink.findByPk(info.shortlinkId)
                .then((shrt) => {
                    shrt.update({
                        shorturl: info.myshorturl,
                        status: 1
                    })
                })
                .error((err) => {
                    console.log('2BIG ERROR: ' + err);
                }) */
            }
            
            //  check for personalizations
            var SINGLE_MSG = false;
            var chk_message = originalmessage
            .replace(/\[firstname\]/g, 'X')
            .replace(/\[lastname\]/g, 'X')
            .replace(/\[email\]/g, 'X')
            .replace(/\[url\]/g, 'X');

            if(chk_message == originalmessage) {
                SINGLE_MSG = true;
            }

            var q_bulkId = 'generateBulk';
            var q_tracking_track = 'SMS';
            var q_tracking_type = info.name.replace(/ /g, '_');

            var m_from = sndr.name;
            var m_flash = false;
            var m_intermediateReport = true;
            var m_notifyUrl = 'https://app.tracksend.co/api/sms/notify';
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
                        console.log('MESSAGE ENTRY CREATE STARTED.');
                                                        
                        var updatedmessage  = originalmessage
                        .replace(/\[firstname\]/g, kont.firstname)
                        .replace(/\[lastname\]/g, kont.lastname)
                        .replace(/\[email\]/g, kont.email)
                        .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
                        .replace(/&nbsp;/g, ' ');

                        if(SINGLE_MSG) {
                            var msgto = {
                                "to": phoneformat(kont.phone, kont.countryId),
                                "messageId": shrt.id,
                            }
                            
                            console.log('SINGLE MESSAGE ENTRY CREATE DONE.');
                            return msgto;
                        } else {
                            var msgfull = {
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

                            //  IF SENDING IS COMPLETE, CHARGE BALANCE... AND OTHER HOUSEKEEPING
                            console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures + '; batches = ' + batches);
                            if((successfuls + failures) == batches) {
                                console.log('SUCCESSFULS: ' + successfuls + '; FAILURES : ' + failures);

                                try {
                                    if(successfuls > 0) {
                                        let new_bal = parseFloat(user_balance.balance) - parseFloat(info.units_used);
                                        console.log('old bal = ' + user_balance.balance + '; units used = ' + info.units_used + '; NEW BALANCE = ' + new_bal);

                                        let usr = await models.User.findByPk(user_id)
                                        //  UPDATE UNITS USER BALANCE
                                        await usr.update({
                                            balance: new_bal,
                                        });
                                        //  UPDATE UNITS USED FOR CAMPAIGN
                                        cpn.update({
                                            units_used: info.units_used,
                                            status: 1
                                        });

                                        //  LOG TRANSACTIONS
                                        models.Transaction.create({
                                            description: 'DEBIT',
                                            userId: user_id,
                                            type: 'CAMPAIGN',
                                            ref_id: cpn.id,
                                            units: (-1) * info.units_used,
                                            status: 1,
                                        })

                                        //  REMOVE TEMPORARY DATA
                                        await info.destroy();
                                
                                        // if(failures) req.flash('success', 'Campaign created but some errors occurred.');
                                        let mm = (schedule_) ? 'scheduled to be sent out at ' + moment(schedule_, 'YYYY-MM-DD HH:mm:ss').add(1, 'hour').format('h:mm A, DD-MMM-YYYY') + '.' : 'sent out.';
                                        req.flash('success', 'Campaign created successfully. Messages ' + mm);
                                        var backURL = req.header('Referer') || '/';
                                        res.redirect(backURL);
                                    } else {

                                        req.flash('error', 'An error occurred while sending out your Campaign. Please try again later or contact admin.');
                                        var backURL = req.header('Referer') || '/';
                                        res.redirect(backURL);
                                    }
                                } catch (err) {
                                    console.log('THIS ERROR: ' + err);
            
                                    req.flash('error', 'An error occurred while sending out your Campaign. Please try again later or contact admin.');
                                    var backURL = req.header('Referer') || '/';
                                    res.redirect(backURL);
                                }
                            }
                        });
                
                
                        console.log(JSON.stringify(tosend));
                        counter++;
                        if(end < len) await doLoop(end)
                    })
                }
            }

            var start = 0;
            var grpn = 1000;
            var len = contacts.length;
            var counter = 1;
            var batches = Math.ceil(len/grpn);
    
            var successfuls = 0;
            var failures = 0;
    
            console.log('Start Looping...');
            await doLoop(0);
            
            //  finally redirect back to page
            console.log('END... NEW PAGE!');

        }

    })
    .catch((err) => {
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

    async function doWhatsApp() {
        var API = require('../config/cfg/chatapi')();
        const { default: axios } = require('axios');
        var qs = require('qs');
        var whatsappSendMessage = require('../my_modules/whatsappSendMessage');
        
        try {
            var sendmethod = parseInt(req.body.wa_send_method);

            console.log('====================================');
            console.log('ALL SENT = ' + JSON.stringify(req.body));
            console.log('====================================');
            //  create campaign
            var cpn = await models.Campaign.create({
                name: req.body.name,
                description: req.body.description,
                userId: user_id,
                senderId: req.body.senderId,
                shortlinkId: req.body.shorturl,
                message: req.body.message,
                schedule: (req.body.datepicker) ? req.body.schedule : null, //req.body.schedule,
                recipients: req.body.recipients,
                has_utm: (req.body.add_utm && req.body.add_utm == "on") ? 1 : 0,
                mediatypeId: 2, //  '2' for whatsapp
            });
            
            var HAS_SURL = (!req.body.shorturl || req.body.shorturl == '0') ? false : true;
            
            var groups = req.body.group;
            if (groups != 0 && !Array.isArray(groups)) groups = [groups];
            
            console.log('req.body.group = ' + groups + '; json = ' + JSON.stringify(groups));

            if (groups == 0) throw "1001";
            var everything = [];
            var k = 0;

            if (sendmethod === 1) {
                var dd = await models.Group.findAll({
                    include: [{
                        model: models.Contact, 
                        where: {
                            do_whatsapp: true
                        }
                    }],
                    where: {
                        id: {
                            [Op.in]: groups,
                        },
                        userId: req.user.id,
                    },
                })

                //  merge contacts from all groups...
                console.log('====================================');
                console.log('GROUP OUTPUT = ' + JSON.stringify(dd));
                console.log('====================================');

                if(dd.length == 0) throw "1002";

                var arr = [];
                dd.forEach(async (el) => {
                    arr = arr.concat(el.contacts);

                    console.log('group kan...');
                    
                    await models.CampaignGroup.create({
                        campaignId: cpn.id,
                        groupId: el.id,
                    });
                });

                //  remove duplicates
                var contacts = _.uniqBy(arr, 'phone');

                console.log('start processing...');
                
                //  loop through all the batches
                for (let i = 0; i < contacts.length; i++) {

                    console.log('====================================');
                    console.log('kontakt 1 is = ' + JSON.stringify(contacts[i]));
                    console.log('====================================');
                    everything.push(await sendWhatsAppMessage(contacts[i]), "single");
                }
        
                //  finally redirect back to page
                console.log('END... NEW PAGE!');
            } else {
                for (let i = 0; i < groups.length; i++) {
                    console.log('====================================');
                    console.log('kontakt 2 is = ' + JSON.stringify(groups[i]));
                    console.log('====================================');
                    everything.push(await sendWhatsAppMessage(groups[i]), "group");
                    // await sendWhatsAppMessage(contacts[i]);
                }
            }

            Promise.all(everything)
            .then((data) => {
                console.log('====================================');
                console.log();
                console.log('====================================');
                let _msgmsg = (req.body.schedulewa == 'Invalid date') ? 'Messages sent out' : 'Messages would be sent out at ' + req.body.schedulewa;
                req.flash('success', 'Campaign created successfully. ' + _msgmsg);
                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);

            })
            
        } catch(e) {
            console.log('====================================');
            console.log('ERROR OCCURRED: ' + e);
            console.log('====================================');

            await cpn.destroy();
            let emsg = 'Sorry an error occurred. Please try again or contact Admin.';

            if(e == '1001') emsg = 'No valid Group was selected. Please try again.';
            if(e == '1002') emsg = 'No WhatsApp Contact was selected. Kindly try again with appropriate Group(s)';
            // if(e == '1001') emsg = 'No WhatsApp Contact was selected. Kindly try again with appropriate Group(s)';

            req.flash('error', emsg); 
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        }

        async function sendWhatsAppMessage(kont, typ) {

            if(typ == "group") {
                console.log('====================================');
                console.log('GROOUUUPPPOOOOOOOOO');
                console.log('====================================');
                //  { SEND_GROUP_MESSAGES_TO_CHAT-API }
                return;

            }
            k++;
            console.log('*******   Aggregating Contact #' + k + ':...' + JSON.stringify(kont) + '   ********' + typ);
            
            // return new Promise(resolve => {

            //create contact codes
            var args = {};

            if(HAS_SURL) {
                console.log('GET UNIQUE ID!!!');
                
                args = await getUniqueId();

            } else {
                args = {
                    sid : null,
                    slk : null,
                    cid: null, 
                }
            }
            console.log('====================================');
            console.log('ARGS: ' + JSON.stringify(args));
            console.log('====================================');
            console.log('NEXT: Promise.all Done');
            
            return await send(args, kont);

            // })
        }

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
            let shrtlnk = await models.Shortlink.findByPk(req.body.shorturl);
            return {
                sid : shrtlnk? shrtlnk.id : null,
                slk : shrtlnk? shrtlnk.shorturl: null,
                cid: uid, 
            };

        }
        
        async function send(args, kont) {
            let nmsg = await cpn.createMessage({
                shortlinkId: args.sid,
                contactlink: args.cid,
                contactId: kont.id,
                mediatypeId: 2,
                status: 1,
            })

            console.log('MESSAGE ENTRY CREATE STARTED.');
                                                
            let updatedmessage  = req.body.message
            .replace(/\[firstname\]/g, kont.firstname)
            .replace(/\[lastname\]/g, kont.lastname)
            .replace(/\[email\]/g, kont.email)
            .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
            .replace(/&nbsp;/g, ' ');

            //  { SEND_SINGLE_MESSAGES_TO_CHAT-API }

            let tophone = phoneformat(kont.phone, kont.countryId);
            // console.log('====================================');
            // console.log(nmsg, tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken);
            // console.log('====================================');
            sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);

            // console.log("Error: Please try again later");
                        
        }

        async function sendSingleMsg(msg, phone, body, instanceurl, token, kid, schedule) {
            let new_resp = await whatsappSendMessage(phone, body, instanceurl, token, kid, msg.id, schedule);
        }

    }

}

exports.view = (req, res) => {
    var user_id = req.user.id;
    var cmgnid = req.params.id;


    console.log('showing page...'); 
        
    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = :cid ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = :cid ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE status = 2 AND campaignId = :cid ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE (status = 3 OR status = 4) AND campaignId = :cid ) t4," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE clickcount > 0 AND campaignId = :cid ) t5," + 
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = :cid ) t6," + 
            "              ( SELECT userId                          FROM campaigns WHERE id = :cid ) t7 " +
            "WHERE t7.userId = :id" , {
                replacements: {
                    cid: cmgnid,
                    id: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            }
        ).then(([results, metadata]) => {
            console.log(results);
            return results;
        }),
        models.Campaign.findAll({ 
            where: { 
                id: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                limit: 100,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
            limit: 1,
        }), 
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        sequelize.query(
            "SELECT COUNT(messages.id) AS msgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = :uid " +
            "AND campaigns.id = :id ", {
                replacements: {
                    uid: user_id,
                    id: cmgnid,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));
           
            return results.msgcount;
        }),
    ]).then(([summary, cpgnrecp, mcount]) => {
        console.log('qqq= '+cpgnrecp.length);
        var recipients = cpgnrecp[0].messages;
        console.log('CONTA: ' + JSON.stringify(cpgnrecp[0]));
        console.log('CONTA: ' + JSON.stringify(recipients));
        
        recipients = recipients.map(ii => {
            let jj = JSON.stringify(ii);
            var i = JSON.parse(jj);
            var st = parseInt(i.status);

            if(i.contact == null && i.destination.length > 0) {
                var ds = i.destination;
                let pp = '0' + ds.substr(-10);

                i.contact = {
                    firstname: '--',
                    lastname: '--',
                    phone: pp,
                }
            }

            console.log('PHONE = ' + i.contact.phone);
            
            switch (st) {
                case 0:
                    i.status = "Pending"
                    break;
                case 1:
                    i.status = "Delivered"
                    break;
                case 2:
                    i.status = "Failed"
                    break;
                case 3:
                    i.status = "DND"
                    break;
                case 4:
                    i.status = "Invalid"
                    break;
            
                default:
                    break;
            }
            
            return i;
            
        });
        console.log('====================================');
        console.log('SUMM: ' + JSON.stringify(summary) + '; MESS: ' + JSON.stringify(cpgnrecp) + '; CMSG: ' + JSON.stringify(recipients.length));
        console.log('====================================');
        var mname = cpgnrecp.map((r) => r.name);
        var mmsg = cpgnrecp.map((r) => r.message);
        
        res.render('pages/dashboard/campaign', { 
            page: 'Campaign: "' + mname + '"', //'Campaigns',
            campaigns: true,

            args: {
                delivered: summary.delivered,
                pending: summary.pending,
                failed: summary.failed, 
                undeliverable: summary.undeliverable,
                clicks: summary.clicks,
                recipients: recipients,
                mname,
                mmsg,
                mcount,
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : (parseInt(summary.clickc) * 100/parseInt(summary.delivered))),
            }
        });

    });
};

exports.copy = (req, res) => {
    var user_id = req.user.id;
    var id = req.query.id;

    console.log('showing page...' + id); 
        
    Promise.all([
        sequelize.query(
            "SELECT campaigns.id, campaigns.name, campaigns.units_used, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, campaigns.createdAt FROM campaigns " +
            "JOIN campaign_groups ON campaign_groups.campaignId = campaigns.id " +
            "JOIN groups ON groups.id = campaign_groups.groupId " +
            "WHERE campaigns.userId = :uid " +
            "GROUP BY campaigns.id " +
            "ORDER BY campaigns.createdAt DESC ", {
                replacements: {
                    uid: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ), 
        models.Sender.findAll({     //  get all sender ids for display in form
            where: { 
                userId: user_id,
                status: 1
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({      //  get all groups for display in form, except uncategorized group
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }),
        models.Group.findAll({      //  get only the uncategorized group
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        }),
        models.Sender.count({       //  get count of sender ids
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({       //  get count of "active" sender ids
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        models.Contact.count({      //  get count of contacts
            where: { 
                userId: user_id,
            }
        }), 
    ]).then(([cpns, sids, grps, non, csender, casender, ccontact]) => {
        var ngrp = non[0].id;

        console.log('====================================');
        console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        console.log('====================================');
        if(!csender) var nosenderids = true; else var nosenderids = false;
        if(!casender) var noasenderids = true; else var noasenderids = false;
        if(!ccontact) var nocontacts = true; else var nocontacts = false;

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            flashtype, flash,

            args: {
                cpns,
                sids,
                grps,
                ngrp,
                nosenderids,
                noasenderids,
                nocontacts,
            }
        });
    });
};

