var models = require('../models');
var moment = require('moment');
const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const Op = Sequelize.Op;
const fs = require('fs'); 
var scheduler = require('node-schedule');

var smsSendEngines = require('../my_modules/smsSendEngines');
var { getWhatsAppStatus } = require('../my_modules/whatsappHandlers')();
var uploadMyFile = require('../my_modules/uploadHandlers');
var phoneformat = require('../my_modules/phoneformat');
const randgen = require('../my_modules/randgen');
var _message = require('../my_modules/output_messages');


exports.index = (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    
    console.log('....................showing page......................'); 
        
    Promise.all([
        sequelize.query( 
            "SELECT " +
            "   C1.id, " +        //      kenni 
            "   C1.name, " +
            "   C1.units_used, " +
            "   GROUP_CONCAT(G1.name SEPARATOR ', ') AS grpname, " +
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
            "LEFT OUTER JOIN groups G1 ON G1.id = CG1.groupId " +
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
                    wtd: ea.wtd[t],
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
                    wtd: ea.fwtd[f],
                    status: "active",
                })
            }
            // ea.fid = ea.fid? ea.fid.map(e => { return parseInt(e) }) : null;

            
        });
        console.log('====================================');
        console.log('cpns: ' + JSON.stringify(cpns)); // + ', sids: ' + JSON.stringify(sids) + ', grps: ' + JSON.stringify(grps) + ', csender: ' + csender + ', casender: ' + casender + ', ccontact' + ccontact);
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

        // res.render('pages/dashboard/whatsappcompleteoptin', { 
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

exports.add = async (req, res) => {
    var user_id = req.user.id;
    // var user_id = 10;
    var tempid = req.body.analysis_id;
    var ctype = req.body.type;
    console.log('====================================');
    console.log('WLELONE: ' + (Array.isArray(tempid) ? 'yes' : 'no') + ' ; ' + tempid);
    console.log('====================================');

    if(Array.isArray(tempid)) {

    } else {
        tempid = [tempid]
        ctype = [ctype]
    }

    for(var ii = 0; ii < tempid.length; ii++) {
        //  RETRIEVE CAMPAIGN DETAILS FROM TEMPORARY TABLE 
        var info = await models.Tmpcampaign.findByPk(tempid[ii]);

        if(ctype[ii] == "whatsapp") {
            doWhatsApp();
        } else if(info) {
            if(info.ref_campaign) {
                let ref = info.ref_campaign;
                let schedule = info.schedule;
                let within_days = info.within_days;

                console.log('====================================');
                console.log('dataa = '+ ii + ' - ' + ref);
                console.log('====================================');

                if(!schedule || schedule === 'null') {
                    let ts = moment().add(parseInt(within_days), 'days');
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
                    console.log('====================================');
                    console.log('date 2b='+ts);
                    console.log('====================================');
                    var date = new Date(ts);
                    console.log('====================================');
                    console.log('date 3b=' + JSON.stringify(ts));
                    console.log('====================================');
                    
                }

                scheduler.scheduleJob(date, _dosms);
                function _dosms() {
                    doSMS(info, ref)
                }
            } else {
                doSMS(info, null);
            }
        } else {
            console.log('INVALID OPERATION!');
        }
    }
    
    async function doSMS(info, ref) {
        //  ...continues here if type-sms and has been analysed 
        //  GET USER BALANCE
        var user_balance = await models.User.findByPk(user_id, {
            attributes: ['balance'], 
            raw: true, 
        })
        
        console.log('USER BALANCE IS ' + JSON.stringify(user_balance));
        
        if(!ref && (user_balance.balance < info.total_units)) {
            console.log('INSUFFICIENT UNITS!');

            return;
        }
        
        console.log('form details are now...'); 

        console.log('form details are now: ' + JSON.stringify(info)); 

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
            condition: info.grp,
            within_days: info.within_days,
            ref_campaign: ref,
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
                                        ],
                                        ...(
                                            toall ? {
                                                [Sequelize.Op.or]: [
                                                    {
                                                        do_sms: 0
                                                    },
                                                    {
                                                        do_sms: 1
                                                    }
                                                ],
                                            } : {
                                                do_sms: tooptin ? 1 : 0         //  opted-ins = 1; awaiting = 0
                                            }
                                        )
                                        }
                                } : {
                                    where: {
                                        ...(
                                            toall ? {
                                                [Sequelize.Op.or]: [
                                                    {
                                                        do_sms: 0
                                                    },
                                                    {
                                                        do_sms: 1
                                                    }
                                                ],
                                            } : {
                                                do_sms: tooptin ? 1 : 0         //  opted-ins = 1; awaiting = 0
                                            }
                                        )
                                    }
                                }
                            )
                        }],
                        where: {
                            id: {
                                [Op.in]: groups,
                            },
                            userId: user_id,
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
                    contacts = _.uniqBy(arr, 'phone');
                } else {
                    let ref = info.ref_campaign;
                    let ref_campaign = await models.Campaign.findByPk(ref, {
                        include: [{
                            model: models.Message, 
                            where: {
                                ...( info.grp == "clicked" ? {
                                    clickcount: {
                                        [Sequelize.Op.gt] : 0
                                    }
                                } : {
                                    clickcount: 0
                                })
                            },
                            include: [{
                                model: models.Contact, 
                            }],
                        }],
                    });
                
                    var arr = ref_campaign.messages.map( k => { return k.contact });

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
                .replace(/\[lastname\]/g, 'X')
                .replace(/\[email\]/g, 'X')
                .replace(/\[url\]/g, 'X');

                if(chk_message == originalmessage) {
                    SINGLE_MSG = true;
                }

                await smsSendEngines(
                    req, res,
                    user_id, user_balance, sndr, info, contacts, schedule, schedule_, 
                    cpn, originalmessage, _message, UNSUBMSG, DOSUBMSG, SINGLE_MSG, HAS_SURL
                );
                

            }

        })
        .catch((err) => {
            console.error('BIG BIG ERROR: ' + err);
        })

        return;

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
                contactId: kont.id,
                platformtypeId: 2,
                status: 0,
            })

            console.log('MESSAGE ENTRY CREATE STARTED.');
                                                
            let updatedmessage  = req.body.message
            .replace(/\[firstname\]/g, kont.firstname)
            .replace(/\[lastname\]/g, kont.lastname)
            .replace(/\[email\]/g, kont.email)
            .replace(/\[url\]/g, 'http://tsn.pub/' + args.slk + '/' + args.cid)
            .replace(/\s{2,}/g, '')
            // .replace(/\\r/g, '')
            // .replace(/\\n/g, '')
            // .replace(/\\t/g, '')
            .replace(/&nbsp;/g, ' ');

            //  { SEND_SINGLE_MESSAGES_TO_CHAT-API }
                console.log('1 kont = ' + JSON.stringify(kont));

            let tophone = phoneformat(kont.phone, kont.countryId);
            // console.log('====================================');
            // console.log(nmsg, tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken);
            // console.log('====================================');

            if(!req.files || Object.keys(req.files).length === 0) {
                // sendSingleMsg(nmsg, tophone, updatedmessage, req.user.wa_instanceurl, req.user.wa_instancetoken, kont.id, req.body.schedulewa);
                console.log('2 kont = ' + JSON.stringify(kont));
                
                await whatsappSendMessage('message', tophone, updatedmessage, req.user.wa_instanceid, req.user.wa_instancetoken, kont.id, nmsg.id, req.body.schedulewa);
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
                await whatsappSendMessage('file', tophone, nfile, req.user.wa_instanceid, req.user.wa_instancetoken, kont.id, nmsg.id, req.body.schedulewa, uploadedfile.filename, updatedmessage);
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
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE status = 2 AND campaignId = :cid ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE (status = 3 OR status = 4) AND campaignId = :cid ) t4," +
            "              ( SELECT COUNT(status) AS viewed         FROM messages WHERE status = 5 AND campaignId = :cid ) t5," +
            "              ( SELECT COUNT(status) AS clickc         FROM messages WHERE clickcount > 0 AND campaignId = :cid ) t6," + 
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
                case 5:
                    i.status = "Viewed"
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

        let cpgntype = cpgnrecp[0].platformtypeId == 1 ? "SMS" : "WhatsApp";
        let show_viewed = cpgnrecp[0].platformtypeId == 1 ? false : true;
        
        res.render('pages/dashboard/campaign', { 
            page: '(' + cpgntype + ') Campaign: "' + mname + '"', //'Campaigns',
            campaigns: true,

            args: {
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

