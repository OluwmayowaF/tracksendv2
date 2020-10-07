var models = require('../models');
var moment = require('moment');
const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const Op = Sequelize.Op;
const mongoose = require('mongoose');
var mongmodels = require('../models/_mongomodels');
const fs = require('fs'); 
var scheduler = require('node-schedule');

var smsSendEngines = require('../my_modules/sms/smsSendEngines');
var { getWhatsAppStatus } = require('../my_modules/whatsappHandlers')();
var uploadMyFile = require('../my_modules/uploadHandlers');
var phoneformat = require('../my_modules/phoneformat');
var apiAuthToken = require('../my_modules/apitokenauth');
const randgen = require('../my_modules/randgen');
var _message = require('../my_modules/output_messages');


exports.index = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    
    console.log('....................showing page......................'); 

    Promise.all([
        mongmodels.PerfCampaign.find({     //  get all pending perf campaigns
            userId: user_id,
            "status.stage": {
                $and: [ {$ne: "running"}, {$ne: "expired"} ]
            }
        })
        .sort({
            "createdAt": -1
        }),
        mongmodels.PerfContact.find({}),      //  get all perf contacts
    ]).then(async ([pcpns, pconts, ]) => {

        //  return to this when automating calculations for contacts requirement
        /* pcpns.forEach(pc => {
            let cond = pc.conditionset;
            let _or = []
            if(cond.age) {
                let _and = [];
                cond.age.forEach(age => {
                    let from, to;
                    if(age == "Above 65") {
                        from = 65; to = 0;
                    } else {
                        from = age.split(' - ')[0];
                        to = age.split(' - ')[1];
                    }

                    _and.push({ $ge: from }, { $le: to });
                })
            }
        })
        */

        //  return to this when automating calculations for contacts requirement
        /* mongmodels.PerfContact.find({
            ...(
                (cc.age) ? {
                    "fields.age": {
                        $or: [
                            { $and: [{ $ge: 18 }, { $le: 24 }] },
                            { $and: [{ $ge: 34 }, { $le: 44 }] },
                        ]
                    },
                } : {}
            ),
            "fields.age": {
                $or: [
                    { $and: [{ $ge: 18 }, { $le: 24 }] },
                    { $and: [{ $ge: 34 }, { $le: 44 }] },
                ]
            },
            "fields.gdr": {
                $or: [
                    { $and: [{ $ge: 18 }, { $le: 24 }] },
                    { $and: [{ $ge: 34 }, { $le: 44 }] },
                ]
            }
        }) */


        // res.render('pages/dashboard/whatsappcompleteoptin', { 
        res.render('pages/dashboard/perfcampaigns', { 
            page: 'Performance Campaigns',
            campaigns: true,
            pcampaigns: true,
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

exports.analyse = async (req, res) => {
    // var user_id = req.user.id;
    var user_id = 10;
    let form = req.body;
    var _status;

    try {
        let reqs = form.pc_criteria;
        reqs = Array.isArray(reqs) ? reqs : [ reqs ];
        let reqlist = [];
        reqs.forEach(r => {
            reqlist.push({ [r]: Array.isArray(form['pc_target_' + r]) ? form['pc_target_' + r] : [form['pc_target_' + r]] })
        })

        if(form.name.length == 0) throw 'name';
        if(form.measure.length == 0) throw 'measure';
        if(form.sender.length == 0) throw 'sender';
        if(form.message.length == 0) throw 'message';
        if(reqlist.length == 0) throw 'criteria';
        if((form.budget == 0) || isNaN(parseFloat(form.budget))) throw 'budget';

        let newcampaign = await mongmodels.PerfCampaign.create({
            userId: user_id,
            name: form.name,
            type: form.type,
            measure: form.measure,
            senderId: form.sender,
            message: form.message,
            conditionset: reqlist,
            budget: form.budget,
            shorturl: form.myshorturl,
            startdate: form.datepicker,
            status: { stage: 'pre-analyze', active: true },
            addoptin: form.add_optin
        });

        
        _status = {
            response: {
            }, 
            responseType: "SUCCESS", 
            responseCode: "OK", 
            responseText: "Success", 
        }

    } catch(err) {
        console.log(err);
        let errmsg = 'Please specify ';

        switch (err) {
            case 'name':
                errmsg += "'Campaign Name', ";
                // break;
            case 'measure':
                errmsg += "'Measure', ";
                // break;
            case 'sender':
                errmsg += "'Sender ID', ";
                // break;
            case 'message':
                errmsg += "'Message', ";
                // break;
            case 'reqlist':
                errmsg += "'Criteria', ";
                // break;
            case 'budget':
                errmsg += "'Budget', ";
                break;
        
            default:
                break;
        }
        if( errmsg == 'Please specify ') {
        }

        _status = {
            response: "Input error", 
            responseType: "ERROR", 
            responseCode: "E000", 
            responseText: errmsg, 
        }
    }

    res.send(_status);
    return;
}

exports.add = async (req, res) => {
    console.log('1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\');
    if(req.externalapi) console.log('1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\');
    
    var aux_obj = {};
    try {
        var user_id = req.user.id;
        var is_api_access = false;
        // var user_id = 10;
    } catch {
        let _id;
        if(_id = await apiAuthToken(req.body.token)) {
            req.user = {id : _id};
            var user_id = req.user.id;
            var is_api_access = true;

            let sms_service = await models.User.findByPk(user_id, {
                attributes: ['sms_service'],
            })
            console.log('%%%%%%%%%%%%%%%%%sms_service='+JSON.stringify(sms_service));
            
            aux_obj = {
                sms_service: sms_service.sms_service,
            };
        } else return;
    }

    var tempid = req.body.analysis_id;
    var ctype = req.body.type;
    console.log('====================================');
    console.log('CAMPAIGN OPS: ' + (Array.isArray(tempid) ? 'yes' : 'no') + ' ; ' + tempid + "tempid.length="+tempid.length);
    console.log('====================================');

    if(!Array.isArray(tempid)) {
        tempid = [tempid]
        ctype = [ctype]
    }

    for(var ii = 0; ii < tempid.length; ii++) {
        //  RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE 
        console.log(ii + " - RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE____________________________________________________") 
        if(is_api_access && tempid[0] == 'api') {
            var info = req.body.info; ii = tempid.length;
        } else {
            console.log("______________________________________________TMPTABLE____________________________________________________") 
            var info = await models.Tmpcampaign.findByPk(tempid[ii]);
        }

        if(ctype[ii] == "whatsapp") {
            doWhatsApp();
        } else if(info) {
            console.log("______________________________________________info____________________________________________________") 
            if(info.ref_campaign) {
            console.log("______________________________________________ref_campaign____________________________________________________") 
                let ref = info.ref_campaign;
                let schedule = info.schedule;
                let within_days = info.within_days;

                console.log('====================================');
                console.log('|||||||||||||||||| dataa = '+ ii + ' - ');
                console.log('====================================');

                if(!schedule || schedule === 'null') {
                    let ts = moment().add(parseInt(within_days), 'days');
                    // let ts = moment().add(parseInt(within_days), 'minutes');
                    console.log('====================================');
                    console.log('date 2a='+ts);
                    console.log('====================================');
                    var date = new Date(ts);
                    console.log('====================================');
                    console.log('date 3a=' + JSON.stringify(ts));
                    console.log('====================================');
                } else {
                    console.log('====================================');
                    console.log('date 1b='+schedule);
                    console.log('====================================');
                    let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'days');
                    // let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'minutes');
                    console.log('====================================');
                    console.log('date 2b='+ts);
                    console.log('====================================');
                    var date = new Date(ts);
                    console.log('====================================');
                    console.log('date 3b=' + JSON.stringify(ts));
                    console.log('====================================');
                }

                scheduler.scheduleJob(date, function(reff) {
                    console.log('_________reff=' + reff + '___________');
                    
                    doSMS(info, reff)
                }.bind(null, info.id)) 
                
                /* _dosms.bind(info.id));
                function _dosms(reff) {
                } */
            } else {
                let resp = await doSMS(info, null);                                                                                                                                                           
                console.log('2++++++++++'+resp);
                if(is_api_access && tempid[0] == 'api') return resp;
            }
        } else {
            console.log('INVALID OPERATION!');
        }
    }
    
    async function doSMS(info, ref) {
        //  ...continues here if type-sms and has been analysed 
        
        // get real ref
        var nref = null;
        if(ref) {
            info = await models.Tmpcampaign.findByPk(ref);
            nref = info.ref_campaign;
            console.log('_____________________ THIS IS REF =' + JSON.stringify(nref) + '_____________________ THIS IS rrREF =' + JSON.stringify(info.ref_campaign));
        }

        //  GET USER BALANCE
        let user_balance_ = await models.User.findByPk(user_id, {
            attributes: ['balance'], 
            raw: true, 
        })
        var user_balance = user_balance_.balance;
        console.log('USER BALANCE IS ' + JSON.stringify(user_balance));
        
        if(!ref && (user_balance < info.total_units)) {
            console.log('INSUFFICIENT UNITS!');

            return;
        }
        
        console.log('form details are now...'); 

        var originalmessage  = info.message.replace(/[^\x00-\x7F]/g, "");
        
        var schedule_ = (info.schedule && !ref) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : null;  //  for DB
        var schedule  = (info.schedule && !ref) ? moment(info.schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.000Z') : null;   //  for infobip

        var UNSUBMSG = false;
        if(info.add_optout) {
            UNSUBMSG = true; //_message('msg', 1091, ) '\n\nTo unsubscribe, click: https://dev2.tracksend.co/sms/optout/';
        }
        var DOSUBMSG = false;
        if(info.add_optin) {
            DOSUBMSG = true; //_message('msg', 1091, ) '\n\nTo unsubscribe, click: https://dev2.tracksend.co/sms/optout/';
        }

        
        //  create campaign
        let prom = await Promise.all([
            models.Campaign.create({
                name: info.name,
                description: info.description,
                userId: user_id,
                senderId: info.senderId,
                shortlinkId: info.shortlinkId,
                message: originalmessage,
                schedule: schedule_,
                recipients: info.recipients,
                has_utm: info.has_utm,
                condition: info.grp,
                within_days: info.within_days,
                ref_campaign: nref,
            }),
            models.Sender.findByPk(info.senderId)
        ])
        .then(async ([cpn, sndr]) => {
            //  bind campaign to group(s)   //  group | dnd | myshorturl
            // var group = info.grp;
            
            var HAS_SURL = false;
            // console.log('info.grp = ' + info.grp + 'ppp-info.grp = ' + JSON.stringify(info.grp) + '______ref = ' + ref);
            // console.log((info.grp != 0 && !Array.isArray(info.grp)) ? "NON-ARRAY" : "ARRAY");

            var groups
            if ((info.grp === "clicked") || (info.grp === "unclicked") || (info.grp === "elapsed")) {
                groups = [info.grp]; 
            } else {
                let groups_ = JSON.parse(info.grp);//
                groups = groups_.map(g => {
                    return mongoose.Types.ObjectId(g);
                })
            }
            
            // console.log('______________________info.group = ' + groups + '; json = ' + JSON.stringify(groups));
            var skip = (info.skip_dnd && info.skip_dnd == "on");
            var unsub     = info.add_optout;
            var dosub     = info.add_optin;
            var tooptin   = info.to_optin;
            var toawoptin = info.to_awoptin;
            var toall     = tooptin && toawoptin;
            console.log('===========================');
            console.log('tooptin='+tooptin+'; toawoptin='+toawoptin+'; toall='+toall);
            console.log('===========================');
            
            var contacts;         
            if(groups !== 0) {

                if(!ref) {
                    var dd = await mongmodels.Group.aggregate([
                        {
                            $match: {
                                _id: {
                                    $in: groups,
                                },
                                userId: user_id,
                            }
                        }, {
                            $lookup: {
                                from: "contacts",
                                // localField: '_id', 
                                // foreignField: 'groupId',
                                as: 'contacts',
                                let: {
                                    "group_id": "$_id"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            userId:  user_id, 
                                            $expr: {
                                                $eq: [
                                                    "$groupId", "$$group_id"
                                                ],
                                            },
                                            ...(
                                                skip ? {
                                                    $and: [
                                                        {status: { $ne: 2 }},
                                                        {status: { $ne: 3 }}
                                                    ],
                                                    ...(
                                                        toall ? {
                                                            $or: [
                                                                { do_sms: 0 },
                                                                { do_sms: 1 }
                                                            ],
                                                        } : {
                                                            do_sms: tooptin ? 1 : 0         //  opted-ins = 1; awaiting = 0
                                                        }
                                                    )
                                                } : {
                                                    ...(
                                                        toall ? {
                                                            $or: [
                                                                { do_sms: 0 },
                                                                { do_sms: 1 }
                                                            ],
                                                        } : {
                                                            do_sms: tooptin ? 1 : 0         //  opted-ins = 1; awaiting = 0
                                                        }
                                                    )
                                                }
                                            )
                                        }
                                    },
                                ]
                            }
                        }, {
                            $project: {
                                "contacts.firstname": 1,
                                "contacts.lastname": 1,
                                "contacts.phone": 1,
                                "contacts.email": 1,
                                "contacts.country.id": 1,
                                "contacts._id": 1,
                                // "_id": 0
                            }
                        }                        
                    ])      //  consider adding .exec() for proper promise handling
                    
                    //  merge contacts from all groups
                    var arr = [];
                    dd.forEach(async (el) => {
                        arr = arr.concat(el.contacts);

                        await models.CampaignGroup.create({
                            campaignId: cpn.id,
                            groupId: el._id,
                            groupName: el.name,
                        })
                        .error((err) => {
                            console.log('2BIG ERROR: ' + err);
                        })
                    });

                    //  remove duplicates
                    contacts = _.uniqBy(arr, 'phone');
                } else {
                    // let ref = info.ref_campaign;
                    let ref_campaign = await models.Campaign.findByPk(nref, {
                        include: [{
                            model: models.Message, 
                            ...( info.grp != "elapsed" ? {
                                where: {
                                    ...( info.grp == "clicked" ? {
                                        clickcount: {
                                            [Sequelize.Op.gt] : 0
                                        }
                                    } : {
                                        clickcount: 0
                                    })
                                },
                            } : {}),
                            /* include: [{
                                model: models.Contact, 
                            }], */
                        }],
                    });
                
                    if(ref_campaign) {
                        var arr_ = ref_campaign.messages.map( k => { return mongoose.Types.ObjectId(k.contactId) });
                        var arr = await mongmodels.Contact.find({
                            _id: {
                                $in: arr_, 
                            }
                        })
                    } else {
                        //  if no valid message
                        info.destroy();
                        return;
                    }
                    //  remove duplicates
                    contacts = _.uniqBy(arr, 'phone');
                }

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
                .replace(/\[first name\]/g, 'X')
                .replace(/\[lastname\]/g, 'X')
                .replace(/\[last name\]/g, 'X')
                .replace(/\[email\]/g, 'X')
                .replace(/\[e-mail\]/g, 'X')
                .replace(/\[url\]/g, 'X');

                if(chk_message == originalmessage) {
                    SINGLE_MSG = true;
                }

                let resp = await smsSendEngines(
                    req, res,
                    user_id, user_balance, sndr, info, contacts, schedule, schedule_, 
                    cpn, originalmessage, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL, is_api_access? aux_obj : null
                );
                console.log('++++++++++++++++++++');
                console.log(resp);
                return resp;

            }

        })
        /* .catch((err) => {
            console.error('BIG BIG ERROR: ' + err);
        }) */

        return prom;

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
            if(req.files && req.files.att_file) console.log('FILE? = ' + JSON.stringify(Object.keys(req.files.att_file)));
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
                platformtypeId: 2, //  '2' for whatsapp
            });
            
            var HAS_SURL = (!req.body.shorturl || req.body.shorturl == '0') ? false : true;
            
            var groups = req.body.group;
            if (groups != 0 && !Array.isArray(groups)) groups = [groups];
            
            // console.log('req.body.group = ' + groups + '; json = ' + JSON.stringify(groups));

            if (groups == 0) throw "1001";
            let ggs_ = groups.map(g => {
                return mongoose.Types.ObjectId(g);
            })
            var everything = [];
            var k = 0;

            if (sendmethod === 1) {
                var dd = await mongmodels.Group.aggregate([
                    {
                        $match: {
                            _id: {
                                $in: ggs_,
                            },
                            userId: user_id,
                        }
                    }, {
                        $lookup: {
                            from: "contacts",
                            // localField: '_id', 
                            // foreignField: 'groupId',
                            as: 'contacts',
                            let: {
                                "group_id": "$_id"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        userId:  user_id, 
                                        $expr: {
                                            $eq: [
                                                "$groupId", "$$group_id"
                                            ],
                                        },
                                        do_whatsapp: 1
                                    }
                                },
                            ]
                        }
                    }, {
                        $project: {
                            "contacts.createdAt": 0,
                            "contacts.updatedAt": 0,
                            "createdAt": 0,
                            "updatedAt": 0,
                        }
                    }                        
                ])      //  consider adding .exec() for proper promise handling

                //  merge contacts from all groups...
                console.log('====================================');
                // console.log('GROUP OUTPUT = ' + JSON.stringify(dd));
                console.log('====================================');

                if(dd.length == 0) throw "1002";

                var arr = [];
                dd.forEach(async (el) => {
                    arr = arr.concat(el.contacts);

                    console.log('group kan...');
                    
                    await models.CampaignGroup.create({
                        campaignId: cpn.id,
                        groupId: el._id,
                    });
                });

                //  remove duplicates
                var contacts = _.uniqBy(arr, 'phone');

                console.log('start processing...');
                
                //  loop through all the batches
                for (let i = 0; i < contacts.length; i++) {
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
            console.error('====================================');
            console.error('ERROR OCCURRED: ' + e);
            console.error('====================================');

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
                contactId: kont._id,
                platformtypeId: 2,
                status: 0,
            })

            console.log('MESSAGE ENTRY CREATE STARTED.');
                                                
            let updatedmessage  = req.body.message
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

            //  { SEND_SINGLE_MESSAGES_TO_CHAT-API }
                console.log('1 kont = ' + JSON.stringify(kont));

            let tophone = phoneformat(kont.phone, kont.country.id);
            // console.log('====================================');
            // console.log(nmsg, tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken);
            // console.log('====================================');

            if(!req.files || Object.keys(req.files).length === 0) {
                // sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);
                console.log('2 kont = ' + JSON.stringify(kont));
                
                await whatsappSendMessage('message', tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken, kont._id, nmsg.id, req.body.schedulewa);
            } else {

                let uploadedfile = await uploadMyFile(req.files.att_file, 'whatsapp');

                /* let ofile = req.files.att_file;
                let filename_ = ofile.name.split('.'); 
                let filename = filename_[0].substr(0, 20); 
                filename = ((filename_[0] > filename) ? filename.substr(0, 14) + '_trunc' : filename) + '.' + filename_[1];
                
                let tempfilename = await randgen('', '', 20, 'fullalphnum', '_');
                var timestamp_ = new Date();
                var timestamp = timestamp_.getTime();
                tempfilename += '_' + timestamp + '.' + filename_[1]; 

                await ofile.mv('tmp/whatsapp/'+tempfilename);  */
                
                // let nfile = await fs.readFileSync('tmp/whatsapp/'+tempfilename, { encoding: 'base64' });
                // nfile = 'data:' + ofile.mimetype + ';base64,' + nfile;
                // console.log('tepfile = ' + tempfilename + '; filenae = ' + filename + '; base64 = ' + nfile);
                
                let nfile = await fs.readFileSync(uploadedfile.filepath, { encoding: 'base64' });
                nfile = 'data:' + uploadedfile.mimetype + ';base64,' + nfile;
                // console.log('tepfile = ' + tempfilename + '; filenae = ' + filename + '; base64 = ' + nfile);
                // sendSingleFile(nmsg, tophone, nfile, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa, filename, updatedmessage);
                await whatsappSendMessage('file', tophone, nfile, req.user.wa_instanceid, req.user.wa_instancetoken, kont._id, nmsg.id, req.body.schedulewa, uploadedfile.filename, updatedmessage);
            }
            /* console.log('====================================');
            console.log('RECEIVED DATA: ' + JSON.stringify(req.body));
            console.log('RECEIVED FILE: ' + JSON.stringify(Object.keys(req.files.att_file)));
            console.log('====================================');
    
            let ofile = req.files.att_file;
            ofile.mv('tmp/whatsapp/'+ofile.name);
    
            let nfile = fs.readFileSync('tmp/whatsapp/'+ofile.name, { encoding: 'base64' });
            console.log('====================================');
            console.log(JSON.stringify(nfile));
            console.log('===================================='); */

                // sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);
            // console.log("Error: Please try again later");
                        
        }

        /* async function sendSingleMsg(msg, phone, body, instanceurl, token, kid, schedule) {
            let new_resp = await whatsappSendMessage('message', phone, body, instanceurl, token, kid, msg.id, schedule);
        }
        async function sendSingleFile(msg, phone, body, instanceurl, token, kid, schedule, filename, caption) {
            let new_resp = await whatsappSendMessage('file', phone, body, instanceurl, token, kid, msg.id, schedule, filename, caption);
        } */

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

}

exports.view = (req, res) => {
    var user_id = req.user.id;
    var cmgnid = req.params.id;


    console.log('showing page...'); 
        
    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = :cid ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = :cid ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE (status = 2 OR status = 3) AND campaignId = :cid ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE status = 4 AND campaignId = :cid ) t4," +
            "              ( SELECT COUNT(status) AS viewed         FROM messages WHERE status = 5 AND campaignId = :cid ) t5," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE status = 1 AND clickcount > 0 AND campaignId = :cid ) t6," + 
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = :cid ) t7," + 
            "              ( SELECT userId                          FROM campaigns WHERE id = :cid ) t8 " +
            "WHERE t8.userId = :id" , {
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
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination', 'contactId'],
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

        models.Campaign.findAll({ 
            where: { 
                ref_campaign: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                limit: 99,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination', 'contactId'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
        }), 

    ]).then(([summary, cpgnrecp, mcount, refcpgns]) => {
        // console.log('qqq= '+cpgnrecp.length);
        var recipients = cpgnrecp[0].messages;
        console.log('REFERENCES: ' + JSON.stringify(refcpgns));
        // console.log('CONTA: ' + JSON.stringify(recipients));
        
        recipients = recipients.map(ii => {
            // let jj = JSON.stringify(ii);
            var i = JSON.parse(JSON.stringify(ii));
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

            // console.log('PHONE = ' + i.contact.phone);
            
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
                case 5:
                    i.status = "Viewed"
                    break;
            
                default:
                    break;
            }
            
            return i;
            
        });
        // console.log('====================================');
        // console.log('SUMM: ' + JSON.stringify(summary) + '; MESS: ' + JSON.stringify(cpgnrecp) + '; CMSG: ' + JSON.stringify(recipients.length));
        // console.log('====================================');
        var mname = cpgnrecp.map((r) => r.name);
        var mmsg = cpgnrecp.map((r) => r.message);

        let cpgntype = cpgnrecp[0].platformtypeId == 1 ? "SMS" : "WhatsApp";
        let show_viewed = cpgnrecp[0].platformtypeId == 1 ? false : true;
        
        // REFERENCE STUFFS (IF ANY)
        let refmsgstat = [];
        refcpgns = refcpgns.map(ref => {
            let stats = {
                pending: 0,      
                delivered: 0,    
                failed: 0,       
                undeliverable: 0,
                viewed: 0,       
                clickc: 0,       
                mcount: ref.messages.length,       
            };
            ref.messages.forEach(msg => {
                switch (parseInt(msg.status)) {
                    case 0:
                        stats.pending += 1
                        break;
                    case 1:
                        stats.delivered += 1
                        break;
                    case 2:
                        stats.failed += 1
                        break;
                    case (3 || 4):
                        stats.undeliverable += 1
                        break;
                    case 5:
                        stats.viewed += 1
                        break;
                
                    default:
                        break;
                }
                stats.clickc += msg.clickcount;
            });
            // refmsgstat.push(stats) 
            // ref.refmsgstat = stats; 
            // const ref_ = Object.assign(ref, {stats});
            let _ref = JSON.parse(JSON.stringify(ref));
            const ref_ = Object.assign(_ref, {stats});
            // let ref_ = {...ref, stats};
            return ref_;
        });

        console.log('__________refcpgns=', JSON.stringify(refcpgns));
        /* let seen = [];
        console.log(JSON.stringify(refcpgns_, function (key, val) {
            if (val != null && typeof val == "object") {
                if (seen.indexOf(val) >= 0) {
                    return;
                }
                seen.push(val);
            }
            return val;
        }) ) */
        
        res.render('pages/dashboard/perfcampaign', { 
            page: '(' + cpgntype + ') Campaign: "' + mname + '"', //'Campaigns',
            campaigns: true,
            pcampaigns: true,

            args: {
                cmgnid,
                delivered: summary.delivered,
                pending: summary.pending,
                failed: summary.failed, 
                undeliverable: summary.undeliverable,
                viewed: summary.viewed,
                show_viewed,
                clicks: summary.clicks,
                recipients: recipients,
                mname,
                mmsg,
                mcount,
                ctr: ((parseInt(summary.delivered) == 0) ? '0' : Math.round((parseInt(summary.clickc) * 10/parseInt(summary.delivered) * 100)) / 10),

                refcpgns,   //  for follow-up campaigns
            }
        });

    });
};

exports.download = (req, res) => {
    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Campaign Result');
    var style = workbook.createStyle({
        /* font: {
            color: '#FF0800',
            size: 12,
        }, */
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    })

    var user_id = req.user.id;
    var cmgnid = req.params.id;


    console.log('trying to download ...'); 
        
    Promise.all([
        models.Campaign.findOne({ 
            where: { 
                id: cmgnid,
                userId: user_id,
            },
            include: [{
                model: models.Message, 
                // limit: 100,
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
            // limit: 1,
        }), 
    ]).then(async ([cpgnrecp]) => {
        console.log('qqq= '+ JSON.stringify(cpgnrecp));
        var recipients = cpgnrecp.messages;
        
        worksheet.cell(1,1).string('First Name').style(style);
        worksheet.cell(1,2).string('Last Name').style(style);
        worksheet.cell(1,3).string('Phone').style(style);
        worksheet.cell(1,4).string('Status').style(style);
        worksheet.cell(1,5).string('Clicked').style(style);
        var itr = 1;

        recipients.forEach(ii => {
           itr++;
            // let jj = JSON.stringify(ii);
            var i = JSON.parse(JSON.stringify(ii));
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

            worksheet.cell(itr,1).string(i.contact.firstname).style(style);
            worksheet.cell(itr,2).string(i.contact.lastname).style(style);
            worksheet.cell(itr,3).string(i.contact.phone).style(style);
            
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
                case 5:
                    i.status = "Viewed"
                    break;
            
                default:
                    break;
            }

            worksheet.cell(itr,4).string(i.status).style(style);
            worksheet.cell(itr,5).number(i.clickcount).style(style);

            
            // console.log('PHONE = ' + i.contact.phone);
            
            
        });
        let timestamp_ = new Date();
        let timestamp = timestamp_.getTime();
        let newfile = 'tmp/downloads/' + cpgnrecp.name + '_' + timestamp + '.xlsx';

        await workbook.write(newfile, (err, status) => {
            if(err) console.log('_______________ERROR: ' + err);
            else res.download(newfile);
        });
        console.log('____________DONE');

    });
};

// not maintained
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

        // console.log('====================================');
        // console.log('cpns: ' + JSON.stringify(cpns) + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
        // console.log('====================================');
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

        res.render('pages/dashboard/perfcampaigns', { 
            page: 'Campaigns',
            campaigns: true,
            pcampaigns: true,
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

