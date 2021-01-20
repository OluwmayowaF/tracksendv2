const models     = require('../models');
const moment     = require('moment');
const _          = require('lodash');
const Sequelize  = require('sequelize');
const sequelize  = require('../config/cfg/db');
const Op         = Sequelize.Op;
const mongoose   = require('mongoose');
const mongmodels = require('../models/_mongomodels');
const fs         = require('fs'); 
const scheduler  = require('node-schedule');

// Get Agenda to schedlue Jobs
const agenda = require('../my_modules/setup.agenda');


const apiController         = require('./ApiController');
const smsSendEngines        = require('../my_modules/sms/smsSendEngines');
const { getWhatsAppStatus } = require('../my_modules/whatsappHandlers')();
const uploadMyFile          = require('../my_modules/uploadHandlers');
const phoneformat           = require('../my_modules/phoneformat');
const apiAuthToken          = require('../my_modules/apitokenauth');
const getSMSCount           = require('../my_modules/sms/getSMSCount');
const getRateCharge         = require('../my_modules/sms/getRateCharge');
const randgen               = require('../my_modules/randgen');
const _message              = require('../my_modules/output_messages');
const filelogger            = require('../my_modules/filelogger');


exports.index = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    
    console.log('....................showing page......................'); 

    Promise.all([
        sequelize.query( 
            "SELECT " +
            "   C1.id, " +        //      kenni 
            "   C1.name, " +
            "   C1.cost, " +
            "   GROUP_CONCAT(CG1.groupname SEPARATOR ', ') AS grpname, " +
            "   IF(C1.status = 1, 'Active', 'Error') AS status, " +
            "   IF(C1.platformtypeId = 1, 'SMS', 'WhatsApp') AS platform, " +
            "   GROUP_CONCAT(T1.id SEPARATOR ',') AS tid, " +
            "   GROUP_CONCAT(T1.grp SEPARATOR ',') AS tgp, " +
            "   GROUP_CONCAT(T1.within_days SEPARATOR ',') AS wtd, " +
            "   GROUP_CONCAT(C2.id SEPARATOR ',') AS fid, " +
            "   GROUP_CONCAT(C2.condition SEPARATOR ',') AS fgp, " +
            "   GROUP_CONCAT(C2.within_days SEPARATOR ',') AS fwtd, " +
            "   C1.createdAt " +
            "FROM campaigns C1 " +
            "LEFT OUTER JOIN campaign_groups CG1 ON CG1.campaignId = C1.id " +
            "LEFT OUTER JOIN campaigns C2 ON C2.ref_campaign = C1.id " +       //  kenni
            "LEFT OUTER JOIN tmpcampaigns T1 ON T1.ref_campaign = C1.id " +       //  kenni
            "WHERE C1.userId = :uid AND (C1.ref_campaign = '' OR ISNULL(C1.ref_campaign)) " +
            "GROUP BY C1.id, T1.ref_campaign, C1.ref_campaign " +
            "ORDER BY C1.createdAt DESC ", {    
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
        mongmodels.Group.find({     //  get all groups for display in form, except uncategorized group
            userId: user_id,
            name: {
                $ne: '[Uncategorized]',
            },
        })
        .sort({
            "createdAt": -1
        }),
        mongmodels.Group.find({      //  get only the uncategorized group
            userId: user_id,
            name: '[Uncategorized]',
        }),
        models.Sender.count({        //  get count of sender ids
            where: { 
                userId: user_id,
                // status: 1
            }
        }), 
        models.Sender.count({        //  get count of "active" sender ids
            where: { 
                userId: user_id,
                status: 1
            }
        }), 
        mongmodels.Contact.count({   //  get count of contacts
            userId: user_id,
        }),                          //  consider adding the .exec() to make it full-fledged promise
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

        // var tmps = models
        cpns.forEach(ea => {
            // console.log(ea.tid? JSON.stringify(ea.tid.split(',')) : null);
            // ea.tid = ea.tid? JSON.stringify(ea.tid.split(',').map(e => { e.replace('"', '')})) : null;
            ea.tid = ea.tid ? _.uniq(ea.tid.split(',')).map(e => { return parseInt(e) }) : null;
            ea.wtd = ea.wtd ? _.uniq(ea.wtd.split(',')).map(e => { return parseInt(e) }) : null;
            if(ea.wtd && (ea.wtd.length < 2)) ea.wtd.push(ea.wtd[0]); 
            ea.tgp = ea.tgp? _.uniq(ea.tgp.split(',')) : null;
            ea.tmp = [];
            for(var t = 0; ea.tid && t < ea.tid.length; t++) {
                ea.tmp.push({
                    id: ea.tid[t],
                    grp: ea.tgp[t],
                    grp_desc: (ea.tgp[t] == "clicked" || ea.tgp[t] == "unclicked") ? "To recipients whose links are \"" + ea.tgp[t] + "\"" : "To all recipients",
                    wtd: ea.wtd[t],
                    wtd_desc: (ea.tgp[t] == "clicked" || ea.tgp[t] == "unclicked") ? "Within " + ea.wtd[t] + " day(s)" : "After " + ea.wtd[t] + " day(s)",
                    status: "pending",
                })
            }
            // ea.tid = ea.tid? ea.tid.map(e => { return parseInt(e) }) : null;
            
            ea.fid = ea.fid ? _.uniq(ea.fid.split(',')).map(e => { return parseInt(e) }) : null;
            ea.fwtd = ea.fwtd ? _.uniq(ea.fwtd.split(',')).map(e => { return parseInt(e) }) : null;
            if(ea.fwtd && (ea.fwtd.length < 2)) ea.fwtd.push(ea.fwtd[0]); 
            ea.fgp = ea.fgp? _.uniq(ea.fgp.split(',')) : null;
            ea.flwup = [];
            for(var f = 0; ea.fid && f < ea.fid.length; f++) {
                ea.flwup.push({
                    id: ea.fid[f],
                    grp: ea.fgp[f],
                    grp_desc: (ea.fgp[f] == "clicked" || ea.fgp[f] == "unclicked") ? "To recipients whose links are \"" + ea.fgp[f] + "\"" : "To all recipients",
                    wtd: ea.fwtd[f],
                    wtd_desc: (ea.fgp[f] == "clicked" || ea.fgp[f] == "unclicked") ? "Within " + ea.fwtd[f] + " day(s)" : "After " + ea.fwtd[f] + " day(s)",
                    status: "active",
                })
            }
            // ea.fid = ea.fid? ea.fid.map(e => { return parseInt(e) }) : null;

            
        });

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

        // res.render('pages/dashboard/whatsappcompleteoptin', { 
        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            ncampaigns: true,
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

    const CHARS_PER_SMS = 160;
    const ESTIMATED_CLICK_PERCENTAGE = 0.8;
    const ESTIMATED_UNCLICK_PERCENTAGE = 1 - ESTIMATED_CLICK_PERCENTAGE;

    var _status = {};
    var file_not_logged = true;
    var is_api_access = req.externalapi;
    var HAS_FOLLOWUP = false;
    var user_id, msgcount, cost, name, groups, groups_, message, sender, sender_, shorturl, schedule, datepicker, tid, condition, within_days;
    var skip, utm, isfollowup, cond_1, cond_2, unsub, dosub, tooptin, toawoptin, toall, tonone; //  has_clicked = false, has_unclicked = false, has_elapsed = false;

    try {
        try {
            
            user_id = req.user.id;
            // user_id = 10;
            msgcount = 0;
            cost = 0;
            name = req.body.name;
            groups = req.body.group;
            message = req.body.message;
            sender = req.body.sender;
            shorturl = req.body.shorturl;
            schedule = req.body.schedule;
            datepicker = req.body.datepicker;
            tid = req.body.analysis_id;
            condition = req.body.condition; 
            within_days = req.body.within_days;

            skip = (req.body.skip_dnd && req.body.skip_dnd == "on");
            utm = (req.body.add_utm && req.body.add_utm == "on");

            // cond_1    = (req.body.chk_followup_1 && req.body.chk_followup_1 == "on");
            // cond_2    = (req.body.chk_followup_2 && req.body.chk_followup_2 == "on");

            isfollowup= req.body.chk_followup;

            unsub     = (req.body.add_optout && req.body.add_optout == "on");
            dosub     = (req.body.add_optin && req.body.add_optin == "on");
            tooptin   = (req.body.to_optin && req.body.to_optin == "on");
            toawoptin = (req.body.to_awoptin && req.body.to_awoptin == "on");
            toall     = (tooptin && toawoptin);
            tonone    = (!tooptin && !toawoptin);

            /* if(condition) {
                has_clicked = (condition.indexOf('clicked') === 0 && cond_1) || (condition.indexOf('clicked') === 1 && cond_2);
                has_unclicked = (condition.indexOf('unclicked') === 0 && cond_1) || (condition.indexOf('unclicked') === 1 && cond_2);
                has_elapsed = (condition.indexOf('elapsed') === 0 && cond_1) || (condition.indexOf('elapsed') === 1 && cond_2);
            } */

            //  API ACCESS
            if(is_api_access) {
                console.log('___**********____*******________**********_________');
                
                // user_id = req.body.id;
                
                msgcount = 0;
                cost = 0;
                name = req.body.name;
                message = req.body.message;
                groups_ = req.body.group;
                sender_ = req.body.sender;
                shorturl = req.body.shorturl;
                schedule = req.body.schedule;
                datepicker = req.body.datepicker;
                tid = [0];
                // condition = [0, 0];
                // within_days = [5, 5];

                skip = true;
                utm = true;

                // cond_1    = false;
                // cond_2    = false;

                unsub     = false;
                dosub     = false;
                tooptin   = true;
                toawoptin = true;
                toall     = (tooptin && toawoptin);
                tonone    = (!tooptin && !toawoptin);
                
                // has_clicked = false;
                // has_unclicked = false;
                // has_elapsed = false;

                /* 
                * these extract actual ids of sender and group nd url stuff...particularly for externalapi
                */
                if(sender_) {
                    let sender__ = await models.Sender.findOne({
                        where: {
                            userId: user_id,
                            name: sender_,
                        },
                        attributes: ['id'],
                    })

                    if(!sender__) throw 'sender';
                    sender = sender__.id;
                    console.log('................sender='+sender);
                    
                }
                if(groups_) {
                    let groups__ = await mongmodels.Group.findOne({
                            userId: user_id,
                            name: groups_,
                    }).select([ '_id' ]);

                    if(!groups__) throw 'group';
                    groups = groups__._id
                    // console.log('................group='+groups.id);
                }
                if(req.body.url) {  //  if actual url is sent instead of shorturl id
                    req.query.url = req.body.url;
                    let resp = await apiController.generateUrl(req, res);
                    console.log('^^^^^^^^^^^^^^^^^^ ' + JSON.stringify(resp));
                    
                    if(!resp.error) {
                        shorturl = resp.id;
                    } else throw 'shorturl'
                }

            } 
            
        } catch(err) {
            console.log(err);
            if(err == 'sender' || err == 'group') throw err;
            throw 'auth';
        }
        console.log('form details are now: ' + JSON.stringify(req.body)); 

        console.log('tonone='+tonone+'; tooptin='+tooptin+'; toawoptin='+toawoptin+'; toall='+toall);
        if(Array.isArray(sender)) sender = _.compact(sender);
        if(Array.isArray(sender) && sender.length === 1) sender = sender[0];
        if(Array.isArray(sender)) {
            console.log('====================================');
            console.log('isaaray');
            console.log('====================================');
            HAS_FOLLOWUP = true;
            if(!Array.isArray(groups)) groups = [groups];
            condition = req.body.condition ? (Array.isArray(req.body.condition) ? req.body.condition : [req.body.condition]) : null;
            groups  = [groups].concat(req.body.condition);
            within_days = within_days ? (Array.isArray(within_days) ? within_days : [within_days]) : within_days;
        } else {
            tid = [tid];
            message = [message];
            sender = [sender];
            shorturl = [shorturl];
            groups = (Array.isArray(groups) || is_api_access) ? [groups] : [[groups]];
            console.log('====================================');
            console.log('noarray'+JSON.stringify(sender));
            console.log('====================================');
        }

        // console.log('----' + name.length + '----' + message[0].length + '----' + groups[0].toString().length + '----' + sender[0].toString().length);
        console.log('||||||||||||||||| ', name, ' - ', groups, ' - ', sender, ' - ', message );
        if(!name || !message || !groups || !sender) throw 'fields3';
        if(!(name.length > 1) || !(message[0].length > 1) || !(groups[0].toString().length > 0) || !(sender[0].toString().length > 0)) throw 'fields2';
        
        var uid = 'xxx';
        var allresults = [];
        var contactslength = 0;
        var tids = [];
        var msgcount_ = {}, contactcount_ = {}, cost_ = {};
        var invalidphones = 0;
        var all, bal, fin;
        var int = 0;

        console.log('_______________11group= ' + JSON.stringify(groups));

        while(int < sender.length) {
            if((message[int].length > 1) && (groups[int].toString().length > 0) && (sender[int].toString().length > 0)) {
                /* if((!cond_1 && int == 1) || (!cond_2 && int == 2)) {
                    int++;
                    continue;
                } */
                if(tonone) throw {error: "nocontacts"};

                console.log('THE END!!! balance ' + JSON.stringify(schedule));
                console.log('THE END!!!' +  moment.utc(moment(schedule, 'YYYY-MM-DD HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss'));

                console.log('====================================');
                console.log('iiiiiiiiiiiiiiiiiiii = ' + int);
                console.log('====================================');

                if(int === 0) {  //  done only for the main campaign...followups would get only contact length from here
                    console.log('-------------22a--------------', JSON.stringify(groups));
                    let _grp_ = Array.isArray(groups[0]) ? groups[0] : groups;
                    let group_ = _grp_.map(g => {
                        return mongoose.Types.ObjectId(g);
                    })
                //  extract groups contacts

                    var dd = await mongmodels.Group.aggregate([
                        {
                            $match: {
                                _id: {
                                    $in: group_
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
                        }/* , {
                            $project: {
                                "contacts.firstname": 1,
                                "contacts.lastname": 1,
                                "contacts.phone": 1,
                                "contacts.email": 1,
                                "contacts.country.id": 1,
                                "contacts._id": 1,
                                // "_id": 0
                            }
                        } */
                    ])      //  consider adding .exec() for proper promise handling

                    // console.log('-------------22b--------------' + JSON.stringify(dd));
                    
                    //  merge contacts from all groups
                    var contacts_arr = [];
                    dd.forEach(el => {
                        contacts_arr = contacts_arr.concat(el.contacts);
                    }); 

                    //  remove duplicates
                    contacts_arr = _.uniqBy(contacts_arr, 'phone');

                    contactslength =  contacts_arr.length;
                    for (let i = 0; i < contacts_arr.length; i++) {
                        allresults.push(await checkAndAggregate(contacts_arr[i]));
                    }

                    [all, bal] = await Promise.all([
                        allresults,
                        models.User.findByPk((user_id), {
                            attributes: ['balance'],
                            raw: true
                        })
                    ]);

                    name = [ name ];
                    contactcount_ = { counts: [contactslength] };
                    msgcount_ = { counts: [msgcount], acc: msgcount };
                    cost_ = { counts: [cost], acc: cost };       //  cost accumulated from checkAndAggregate call above
                } else {
                    let contactcount_1;
                    let cost_1;

                    let message_tmp  = message[int]     //  just for temporary estimation
                    .replace(/\[firstname\]/g,  'kont.firstname')
                    .replace(/\[first name\]/g, 'kont.firstname')
                    .replace(/\[lastname\]/g,   'kont.lastname')
                    .replace(/\[last name\]/g,  'kont.lastname')
                    .replace(/\[email\]/g,      'kont.email')
                    .replace(/\[e-mail\]/g,     'kont.email')
                    .replace(/\[phone\]/g,      'kont.phone')
                    .replace(/\[zip-code\]/g,   'kont.zip_code')
                    .replace(/\[zip code\]/g,   'kont.zip_code')
                    .replace(/\[zip_code\]/g,   'kont.zip_code')
                    .replace(/\[zipcode\]/g,    'kont.zip_code')
                    .replace(/\[url\]/g,        'https://tsn.go/xxx/xxx')

                    .replace(/\[loyalty\]/g,    'kont.loyalty')
                    .replace(/\[rank\]/g,       'kont.rank')
                    .replace(/\[company\]/g,    'kont.company')
                    .replace(/\[city\]/g,       'kont.city')
                    .replace(/\[state\]/g,      'kont.state')
                    .replace(/\[count\]/g,      'kont.count')
                    .replace(/\[trip\]/g,       'kont.trip')
                    .replace(/\[category\]/g,   'kont.category')
                    .replace(/\[createdat\]/g,  'kont.createdAt')
                    
                    .replace(/&nbsp;/g,         ' ');

                    let msgcnt = getSMSCount(message_tmp);

                    //  LET'S GET THE PROPORTION OF MAIN MSG TO THIS FLWP MSG AND ESTIMATE COSTS
                    console.log('...........||..........', JSON.stringify(msgcount_), msgcnt, JSON.stringify(contactcount_), JSON.stringify(cost_), JSON.stringify(condition));
                    
                    let avgunt = cost_.counts[0] / msgcount_.counts[0];        //  OR = 1

                    if(condition[int-1] == "clicked") {
                        contactcount_1 = Math.round(ESTIMATED_CLICK_PERCENTAGE * contactcount_.counts[0]);
                    } else if(condition[int-1] == "unclicked") {
                        contactcount_1 = Math.round(ESTIMATED_UNCLICK_PERCENTAGE * contactcount_.counts[0]);
                    } else if(condition[int-1] == "elapsed") {
                        contactcount_1 = contactcount_.counts[0];
                    }

                    let msgcount_1 = Math.round(msgcnt * contactcount_1); 
                    cost_1 = Math.round(msgcount_1 * avgunt);

                    name.push(name[0] + "_(followup: " + condition[int - 1] + ")")
                    contactcount_.counts.push(contactcount_1);
                    msgcount_.counts.push(msgcount_1);
                    msgcount_.acc += msgcount_1;
                    cost_.counts.push(cost_1);
                    cost_.acc += cost_1;
                    console.log('...........|||.........', JSON.stringify(name), msgcount_1, JSON.stringify(contactcount_), JSON.stringify(cost_), JSON.stringify(cost_));
                }

                console.log('====================================');
                console.log('iiiiiiiiiiiiiiiiiiii = ' + JSON.stringify(name));
                console.log('====================================');

                async function checkAndAggregate(kont) { 

                    if(shorturl[0] ) {
                        var shorturl_ = await models.Shortlink.findByPk(shorturl[int]);
                    }
                    console.log('====================================');
                    console.log('cmpan is: ' + message[int]) ;
                    console.log('====================================');
                    var message_  = message[int]
                        .replace(/\[firstname\]/g,  kont.firstname)
                        .replace(/\[first name\]/g, kont.firstname)
                        .replace(/\[lastname\]/g,   kont.lastname)
                        .replace(/\[last name\]/g,  kont.lastname)
                        .replace(/\[email\]/g,      kont.email)
                        .replace(/\[e-mail\]/g,     kont.email)
                        .replace(/\[phone\]/g,      kont.phone)
                        .replace(/\[zip-code\]/g,   kont.zip_code)
                        .replace(/\[zip code\]/g,   kont.zip_code)
                        .replace(/\[zip_code\]/g,   kont.zip_code)
                        .replace(/\[zipcode\]/g,    kont.zip_code)

                        .replace(/\[loyalty\]/g,    kont.loyalty)
                        .replace(/\[rank\]/g,       kont.rank)
                        .replace(/\[company\]/g,    kont.company)
                        .replace(/\[city\]/g,       kont.city)
                        .replace(/\[state\]/g,      kont.state)
                        .replace(/\[count\]/g,      kont.count)
                        .replace(/\[trip\]/g,       kont.trip)
                        .replace(/\[category\]/g,   kont.category)
                        .replace(/\[createdat\]/g,  kont.createdAt)
                        
                        .replace(/\[url\]/g, 'https://tsn.go/' + (shorturl_ ? shorturl_.shorturl : '') + '/' + uid)
                        // .replace(/\[url\]/g, 'https://tsn.go/' + shorturl.shorturl + '/' + uid)
                        .replace(/&nbsp;/g, ' ');

                    let cc = getSMSCount(message_);
                    msgcount += cc;

                    if(file_not_logged) {
                        filelogger('sms', 'API Controller', 'analysing campaign', message_);
                        file_not_logged = false;
                    }
                
                    let _cost_ = await getRateCharge(kont.phone, kont.country.id, user_id);
                    if(!_cost_) {
                        invalidphones++;
                        _cost_ = 0;
                    }
                    console.log('+++++++0000+++++++', kont.phone, cost, _cost_, cc);

                    cost += _cost_ * cc;
                    
                    return _cost_;

                }

                console.log('______00______');
                if(!is_api_access) {
                    // let nint = (int == 2 && condition[0] == 0) ? int - 1 : int;
                    console.log('______11______');
                    
                    if(tid[int] == 0) {
                    console.log(int, '______22aa______', JSON.stringify(name), JSON.stringify(sender), JSON.stringify(shorturl), JSON.stringify(groups), JSON.stringify(message), JSON.stringify(cost_), JSON.stringify(within_days), JSON.stringify(tids));
                        var tt = await models.Tmpcampaign.create({
                            name:       name[int],
                            userId:     user_id,
                            senderId:   sender[int],
                            shortlinkId: (shorturl[int].length > 0) ? shorturl[int] : null,
                            // myshorturl: req.body.myshorturl,
                            grp:        (int === 0) ? JSON.stringify(groups[int]) : groups[int],
                            message:    message[int],
                            // schedule: (req.body.schedule) ? moment(req.body.schedule, 'DD/MM/YYYY h:mm:ss A').format('YYYY-MM-DD HH:mm:ss') : null, //req.body.schedule,
                            schedule:   (datepicker) ? schedule : null, //req.body.schedule,
                            skip_dnd:   (skip) ? skip : null,
                            has_utm:    (utm) ? 1 : 0,
                            to_optin:   (tooptin) ? 1 : 0,
                            to_awoptin: (toawoptin) ? 1 : 0,
                            add_optout: (unsub) ? 1 : 0,
                            add_optin:  (dosub) ? 1 : 0,
                            cost: cost_.counts[int], //(int===0 ? cost : 0) + (condition[int]=="clicked" ? cost * ESTIMATED_CLICK_PERCENTAGE : 0) + (condition[int]=="unclicked" ? cost * ESTIMATED_UNCLICK_PERCENTAGE : 0),
                            total_cost: cost_.acc, // + (condition[int] ? cost * ESTIMATED_CLICK_PERCENTAGE : 0) + (has_unclicked ? cost * ESTIMATED_UNCLICK_PERCENTAGE : 0) + (has_elapsed ? cost : 0),
                            within_days: (int === 0) ? null : within_days[int-1],
                            ref_campaign: (int === 0) ? null : "tmpref_" + tids[0],
                        });
                    console.log('______33______');

                        tt = tt.id;
                    } else {
                        console.log(int, '______22bb______', JSON.stringify(name), JSON.stringify(sender), JSON.stringify(shorturl), JSON.stringify(groups), JSON.stringify(message), JSON.stringify(cost_), JSON.stringify(within_days), JSON.stringify(tids));
                        await models.Tmpcampaign.update({
                            name:       name[int],
                            userId:     user_id,
                            senderId:   sender[int],
                            shortlinkId: (shorturl[int].length > 0) ? shorturl[int] : null,
                            // myshorturl: req.body.myshorturl, 
                            grp:        (int === 0) ? JSON.stringify(groups[int]) : groups[int],
                            message:    message[int], 
                            schedule:   (datepicker) ? schedule : null, //req.body.schedule,
                            skip_dnd:   (skip) ? skip : null,
                            has_utm:    (utm ? 1 : 0),
                            to_optin:   (tooptin ? 1 : 0),
                            to_awoptin: (toawoptin ? 1 : 0),
                            add_optout: (unsub ? 1 : 0),
                            add_optin:  (dosub ? 1 : 0),
                            cost: cost_.counts[int], //(int===0 ? cost : 0) + (condition[int]=="clicked" ? cost * ESTIMATED_CLICK_PERCENTAGE : 0) + (condition[int]=="unclicked" ? cost * ESTIMATED_UNCLICK_PERCENTAGE : 0),
                            total_cost: cost_.acc, // + (condition[int] ? cost * ESTIMATED_CLICK_PERCENTAGE : 0) + (has_unclicked ? cost * ESTIMATED_UNCLICK_PERCENTAGE : 0) + (has_elapsed ? cost : 0),
                            within_days: (int == 0) ? null : within_days[int-1],
                            ref_campaign: (int === 0) ? null : "tmpref_" + tids[0],
                        }, {
                            where: {
                                id: tid[int],
                            }
                        });

                        tt = tid[int];
                    }
                    
                    tids.push(parseInt(tt)); 

                    fin = [bal.balance, tids];

                    console.log('post2... ' + JSON.stringify(fin));
                }
            } else throw 'fields1';
            int++;
        }
        
        console.log('====================================');
        console.log('END OF ANALYSIS!');
        console.log('====================================');
        if(is_api_access) {
            if(cost > bal.balance) throw 'balance'
            let req_ = {
                body: {
                    // id: req.body.id,  
                    token: req.body.token,
                    analysis_id: ['api'],
                    type: ['sms'],
                    info: {
                        name:       name[0],
                        userId:     user_id,
                        senderId:   sender[0],
                        shortlinkId: shorturl[0],
                        // myshorturl: req.body.myshorturl,
                        grp:        JSON.stringify(groups),
                        message:    message[0],
                        // schedule: (req.body.schedule) ? moment(req.body.schedule, 'DD/MM/YYYY h:mm:ss A').format('YYYY-MM-DD HH:mm:ss') : null, //req.body.schedule,
                        schedule:   (datepicker) ? schedule : null, //req.body.schedule,
                        skip_dnd:   (skip) ? 'on' : null,
                        has_utm:    (utm) ? 1 : 0,
                        to_optin:   (tooptin) ? 1 : 0,
                        to_awoptin: (toawoptin) ? 1 : 0,
                        add_optout: (unsub) ? 1 : 0,
                        add_optin:  (dosub) ? 1 : 0,
                        cost,
                        total_cost: cost,
                        within_days: null,    
                        ref_campaign: null,
                    }
                },
                externalapi: true,
            }
            // console.log(JSON.stringify(req_));
            
            let resp = await this.add(req_, res);
            console.log('3+++++++++++++'+JSON.stringify(resp));
            if(resp.status == "error") throw resp.msg;
            _status = resp;
        } else {
            _status = {
                response: {
                    tmpid: fin[1],
                    contactcount: contactcount_,
                    msgcount: msgcount_,
                    invalidphones,      //  optional
                    cost: cost_,
                    balance: fin[0],
                }, 
                responseType: "SUCCESS", 
                responseCode: "OK", 
                responseText: "Success", 

                /* code: "SUCCESS",
                tmpid: fin[1],
                contactcount: contactcount_,
                msgcount: msgcount_,
                invalidphones,      //  optional
                cost: cost_,
                balance: fin[0], */
                // followups: [cond_1 ? 1 : 0, cond_2 ? 1 : 0],
            };
            // return;
        }

    } catch(err) {
        console.log('caught error = ' + JSON.stringify(err));
        
        switch(err) {
            case 'auth':
                _status = {
                    response: "Error: You're not logged in.", 
                    responseType: "ERROR", 
                    responseCode: "E001", 
                    responseText: "Invalid Token", 
                };
                break;
            case 'balance':
                _status = {
                    response: "Error: Inadequate balance.", 
                    responseType: "ERROR", 
                    responseCode: "E002", 
                    responseText: "Inadequate balance", 
                };
                break;
            case 'fields' || 'fields1' || 'fields3':
                _status = {
                    response: "Error: Incomplete fields.", 
                    responseType: "ERROR", 
                    responseCode: "E003", 
                    responseText: "Check the fields for valid entries: 'name'; 'message'; 'sender'; 'group'.", 
                };
                break;
            case 'group':
                _status = {
                    response: "Error: Invalid Group Name.", 
                    responseType: "ERROR", 
                    responseCode: "E053", 
                    responseText: "Invalid Group Name.", 
                };
                break;
            case 'sender':
                _status = {
                    response: "Error: Invalid Sender ID Name.", 
                    responseType: "ERROR", 
                    responseCode: "E043", 
                    responseText: "Invalid Sender ID Name.", 
                };
                break;
            case 'shorturl':
                _status = {
                    response: "Error: Can't create shorturl.", 
                    responseType: "ERROR", 
                    responseCode: "E033", 
                    responseText: "There was an error creating the shorturl.", 
                };
                break;
            default:
                _status = {
                    response: "Error: General Error!" + err, 
                    responseType: "ERROR", 
                    responseCode: "E000", 
                    responseText: "General error. Please contact Tracksend admin.", 
                };
        }
        // return;
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
                    // let ts = moment().add(parseInt(within_days), 'hours');
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
                    // let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'days');
                    // let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'hours');
                    let ts = moment(schedule, 'YYYY-MM-DD HH:mm:ss').add(parseInt(within_days), 'minutes');
                    console.log('====================================');
                    console.log('date 2b='+ts);
                    console.log('====================================');
                    var date = new Date(ts);
                    console.log('====================================');
                    console.log('date 3b=' + JSON.stringify(ts));
                    console.log('====================================');
                }

               /* scheduler.scheduleJob(date, function(reff) {
                    console.log('_________reff=' + reff + '___________');
                    
                    doSMS(info, reff)
                }.bind(null, info.id)) */


                agenda.define('schedule campaign', {priority: 'high', concurrency: 10}, (job, done) => {
                    const {jobInfo} = job.attrs.data;
                    doSMS(jobInfo, reff)
                    done();
                });


                (async function() {
                    await agenda.start();
                    await  agenda.schedule(date, 'schedule campaign', {jobInfo: info.id});
                })();
                
                /* _dosms.bind(info.id));
                function _dosms(reff) {
                } */
            } else {
                let resp = await doSMS(info, null);                                                                                                                                                           
                console.log('2++++++++++'+resp);
                if(is_api_access && tempid[0] == 'api') return resp;
                else {
                    if(( resp && resp.responseType && (resp.responseType == "ERROR")) || (resp && resp.status && (resp.status == 'error'))) {
                        req.flash('error', 'An error occured. Please try again later or contact site admin.');
                    } else {
                        let _msgmsg = (info.schedule == 'Invalid date') ? 'Messages sent out' : 'Messages would be sent out at ' + info.schedulewa;
                        req.flash('success', 'Campaign created successfully. ' + _msgmsg);
                    }
                    //   don't return or 'res.send' yet cos this is in a loop
                }
            }
        } else {
            console.log('INVALID OPERATION!');
        }
    }
    try {
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    } catch(err) {
        console.log(" ;);););) Cannot set headers after they are sent to the client ;);););)");
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
        
        if(!ref && (user_balance < info.total_cost)) {
            console.log('INSUFFICIENT BALANCE!');

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
            
            var contacts, arr;         
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
                        }, /* {
                            $project: {
                                "contacts.firstname": 1,
                                "contacts.lastname": 1,
                                "contacts.phone": 1,
                                "contacts.email": 1,
                                "contacts.country.id": 1,
                                "contacts._id": 1,
                                // "_id": 0
                            } 
                        } */                       
                    ])      //  consider adding .exec() for proper promise handling
                    
                    //  merge contacts from all groups
                    arr = [];
                    dd.forEach(async (el) => {
                        arr = arr.concat(el.contacts);

                        await models.CampaignGroup.create({
                            campaignId: cpn.id.toString(),
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
                        arr = await mongmodels.Contact.find({
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
                    .replace(/\[firstname\]/g,  'X')
                    .replace(/\[first name\]/g, 'X')
                    .replace(/\[lastname\]/g,   'X')
                    .replace(/\[last name\]/g,  'X')
                    .replace(/\[email\]/g,      'X')
                    .replace(/\[e-mail\]/g,     'X')
                    .replace(/\[phone\]/g,      'X')
                    .replace(/\[zip-code\]/g,   'X')
                    .replace(/\[zip code\]/g,   'X')
                    .replace(/\[zip_code\]/g,   'X')
                    .replace(/\[zipcode\]/g,    'X')
                    .replace(/\[url\]/g,        'X')

                    .replace(/\[loyalty\]/g,    'X')
                    .replace(/\[rank\]/g,       'X')
                    .replace(/\[company\]/g,    'X')
                    .replace(/\[city\]/g,       'X')
                    .replace(/\[state\]/g,      'X')
                    .replace(/\[count\]/g,      'X')
                    .replace(/\[trip\]/g,       'X')
                    .replace(/\[category\]/g,   'X')
                    .replace(/\[createdat\]/g,  'X');
                

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

            } else {
                return {
                    response: "Error", 
                    responseType: "ERROR", 
                    responseCode: "E000", 
                    responseText: "An error occured.", 
                }
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
                    }/* , {
                        $project: {
                            "contacts.createdAt": 0,
                            "contacts.updatedAt": 0,
                            "createdAt": 0,
                            "updatedAt": 0,
                        }
                    } */                        
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
                        campaignId: cpn.id.toString(),
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

                var uid = makeId(5);
                var exists = await models.Message.findAll({
                    where: { 
                        campaignId: cpn.id.toString(),
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

            console.log('CampaignController: MESSAGE ENTRY CREATE STARTED.');
                                                
            let updatedmessage  = req.body.message
            .replace(/\[firstname\]/g,  kont.firstname)
            .replace(/\[first name\]/g, kont.firstname)
            .replace(/\[lastname\]/g,   kont.lastname)
            .replace(/\[last name\]/g,  kont.lastname)
            .replace(/\[email\]/g,      kont.email)
            .replace(/\[e-mail\]/g,     kont.email)
            .replace(/\[phone\]/g,      kont.phone)
            .replace(/\[zip-code\]/g,   kont.zip_code)
            .replace(/\[zip code\]/g,   kont.zip_code)
            .replace(/\[zip_code\]/g,   kont.zip_code)
            .replace(/\[zipcode\]/g,    kont.zip_code)

            .replace(/\[loyalty\]/g,    kont.loyalty)
            .replace(/\[rank\]/g,       kont.rank)
            .replace(/\[company\]/g,    kont.company)
            .replace(/\[city\]/g,       kont.city)
            .replace(/\[state\]/g,      kont.state)
            .replace(/\[count\]/g,      kont.count)
            .replace(/\[trip\]/g,       kont.trip)
            .replace(/\[category\]/g,   kont.category)
            .replace(/\[createdat\]/g,  kont.createdAt)
            
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
        models.Campaign.findByPk(cmgnid, {
            include: [{
                model: models.Message, 
                limit: 100,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                /* include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }],  */
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
                /* include: [{
                    model: models.Contact, 
                    attributes: ['id', 'firstname', 'lastname', 'phone'],
                    // through: { }
                }], */ 
                attributes: ['status', 'deliverytime', 'readtime', 'firstclicktime', 'clickcount', 'destination', 'contactId'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
        }), 

    ]).then(async ([summary, cpgnrecp, mcount, refcpgns]) => {
        // console.log('qqq= '+cpgnrecp.length);
        var recipients = [];
        // var recipients = cpgnrecp[0].messages;
        console.log('REFERENCES: ' + JSON.stringify(refcpgns));


        // console.log('CONTA: ' + JSON.stringify(recipients));
        
        recipients = recipients.map(ii => {
            // let jj = JSON.stringify(ii);
            var i = JSON.parse(JSON.stringify(ii));
            var st = parseInt(i.status);

            if(i.contact == null && i.destination && i.destination.length > 0) {
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
        var mname = [];
        var mmsg = [];

        mname.push(cpgnrecp.name); 
        mmsg.push(cpgnrecp.message);
        for(var m = 0; m < cpgnrecp.messages.length; m++) {
            var st = parseInt(cpgnrecp.messages[m].status);
            let c = cpgnrecp.messages[m].contactId;
            if(c && c != 0) {
                console.log('_______c = ' + c);
                let cd = await mongmodels.Contact.findOne({
                    _id: mongoose.Types.ObjectId(c)
                }, "firstname lastname phone");
                cpgnrecp.messages[m]['contact'] = cd;
            } else if (cpgnrecp.messages[m].destination && cpgnrecp.messages[m].destination.length > 0) {
                // var i = cpgnrecp.message;

                var ds = cpgnrecp.messages[m].destination;
                let pp = '0' + ds.substr(-10);      //  this is only suitable for Nigeria contacts. REFACTOR!

                cpgnrecp.messages[m]['contact'] = {
                    firstname: '--',
                    lastname: '--',
                    phone: pp,
                }
            }

            switch (st) {
                case 0:
                    cpgnrecp.messages[m].status = "Pending"
                    break;
                case 1:
                    cpgnrecp.messages[m].status = "Delivered"
                    break;
                case 2:
                    cpgnrecp.messages[m].status = "Failed"
                    break;
                case 3:
                    cpgnrecp.messages[m].status = "DND"
                    break;
                case 4:
                    cpgnrecp.messages[m].status = "Invalid"
                    break;
                case 5:
                    cpgnrecp.messages[m].status = "Viewed"
                    break;
            
                default:
                    break;
            }
        }
        recipients.push(...cpgnrecp.messages);

        console.log('_________________NEW CAMPGN = ' + JSON.stringify(cpgnrecp));
        let cpgntype, show_viewed;
        if(cpgnrecp.platformtypeId == 1) {
            cpgntype = "SMS";
            show_viewed = false;
        } else {
            cpgntype = "WhatsApp";
            show_viewed = true;
        }
        
        // REFERENCE STUFFS (IF ANY)
        // let refmsgstat = [];
        // refcpgns = refcpgns.map(ref => {
        if(refcpgns) for(let r = 0; r < refcpgns.length; r++) {
            let stats = {
                pending: 0,      
                delivered: 0,    
                failed: 0,       
                undeliverable: 0,
                viewed: 0,       
                clickc: 0,       
                mcount: refcpgns[r].messages.length,       
                ctr: 0,       
            };
            // ref.messages.forEach(msg => {
            for(let m = 0; m < refcpgns[r].messages.length; m++) {
                let c = refcpgns[r].messages[m].contactId;

                if(c && c != 0) {
                    let cd = await mongmodels.Contact.findOne({
                        _id: mongoose.Types.ObjectId(c)
                    }, "firstname lastname phone");
                    refcpgns[r].messages[m]['contact'] = cd;
                } else if (refcpgns[r].messages[m].destination && refcpgns[r].messages[m].destination.length > 0) {

                    var ds = refcpgns[r].messages[m].destination;
                    let pp = '0' + ds.substr(-10);      //  this is only suitable for Nigeria contacts. REFACTOR!

                    refcpgns[r].messages[m]['contact'] = {
                        firstname: '--',
                        lastname: '--',
                        phone: pp,
                    }
                }

                switch (parseInt(refcpgns[r].messages[m].status)) {
                    case 0:
                        refcpgns[r].messages[m].status = "Pending"
                        stats.pending += 1
                        break;
                    case 1:
                        refcpgns[r].messages[m].status = "Delivered"
                        stats.delivered += 1
                        break;
                    case 2:
                        refcpgns[r].messages[m].status = "Failed"
                        stats.failed += 1
                        break;
                    case 3:
                        refcpgns[r].messages[m].status = "DND"
                        stats.undeliverable += 1
                        break;
                    case 4:
                        refcpgns[r].messages[m].status = "Invalid"
                        stats.undeliverable += 1
                        break;
                    case 5:
                        refcpgns[r].messages[m].status = "Viewed"
                        stats.viewed += 1
                        break;
                
                    default:
                        break;
                }
                stats.clickc += refcpgns[r].messages[m].clickcount;

            }
            // refmsgstat.push(stats) 
            // ref.refmsgstat = stats; 
            // const ref_ = Object.assign(ref, {stats});
            // let _ref = JSON.parse(JSON.stringify(refcpgns[r]));

            stats.ctr = ((parseInt(stats.delivered) == 0) ? 0 : Math.round((parseInt(stats.clickc) * 10/parseInt(stats.delivered) * 100)) / 10);
            refcpgns[r]['stats'] = stats;

            // let ref_ = {...ref, stats};
            // return ref_;
        }

        console.log('_________________NEW REFCAMPGN = ' + JSON.stringify(refcpgns));

        // console.log('__________refcpgns=', JSON.stringify(refcpgns));
        /* let seen = [];   //  JSON circular reference workaround
        console.log(JSON.stringify(refcpgns_, function (key, val) {
            if (val != null && typeof val == "object") {
                if (seen.indexOf(val) >= 0) {
                    return;
                }
                seen.push(val);
            }
            return val;
        }) ) */
        
        res.render('pages/dashboard/campaign', { 
            page: '(' + cpgntype + ') Campaign: "' + mname + '"', //'Campaigns',
            campaigns: true,
            ncampaigns: true,

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
                    model: models.Contact, //   error: moved to mongodb
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
            "SELECT campaigns.id, campaigns.name, campaigns.cost, GROUP_CONCAT(groups.name SEPARATOR ', ') AS grpname, campaigns.createdAt FROM campaigns " +
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
        models.Contact.count({      //  get count of contacts   //   error: moved to mongodb
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

        res.render('pages/dashboard/campaigns', { 
            page: 'Campaigns',
            campaigns: true,
            ncampaigns: true,
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

