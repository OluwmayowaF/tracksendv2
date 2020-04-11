var models = require('../models');
const sequelize = require('../config/cfg/db');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var whatsappSendMessage = require('../my_modules/whatsappSendMessage');
var _message = require('../my_modules/output_messages');
var env = require('../config/env');
var sendSMS = require('../my_modules/sms/sendSMS');
var getSMSCount = require('../my_modules/sms/getSMSCount');
var getRateCharge = require('../my_modules/sms/getRateCharge');

exports.getQRCode = async (req, res) => {

    var { whatsAppRetrieveOrCreateInstance } = require('../my_modules/whatsappHandlers')();

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: _message('error', 1010, 234),
        });
        return;
    }

    var qrcode = null;

    console.log('showing page...integrations...'); 

    let status = await whatsAppRetrieveOrCreateInstance(user_id);
    var code = status.code;
    var error = status.error;

    res.send({
        code,
        error,
    })

}

exports.notifyAck = (req, res) => {
    
    try {
        if(!req.body) throw "blank";
        if(req.body.messages) console.log('...discarding "messages" response...' + JSON.stringify(req.body.messages));
        else if(req.body.ack) {
            console.log('[[====================================');
            console.log('POST CHATAPI RESPONSE: ' + JSON.stringify(req.body));
            console.log('====================================]]');
            
            let ak = req.body.ack[0]; 
            console.log('dofy+='+JSON.stringify(ak));
            console.log('status 1+='+JSON.stringify(ak.status));
            console.log('status 2+='+ak.status);
            
            if(ak.status == 'delivered') {
            console.log('doing status del');
                models.Message.update(
                    {
                        deliverytime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                        status: 1,
                    },
                    {
                        where: {
                            message_id: ak.id,
                        }
                    }
                )
            }
            else if(ak.status == 'viewed') {
            console.log('doing status viewd');
                models.Message.update(
                    {
                        readtime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                        status: 5,
                    },
                    {
                        where: {
                            message_id: ak.id,
                        }
                    }
                )
            console.log('doing status+='+JSON.stringify(ak.status));
            }
            else console.log('...discarding "sent" ack...');
        }
    } catch(e) {
        console.error('WHATSAPP ACK ERROR: ' + e);
    }

    // res.sendStatus(200);
    res.send("ok");

}

//  tsnwhatsappoptin api lands here
exports.preOptIn = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId

    // req.body.fullname = 'Buhari Obasanjo';
    // req.body.clientid = 'M7H2JZD5FXs3__MlnO2KjL7bzLwjx1QfKQab1hJLDFZexOCQqC';
    // req.body.phone = '08022222222';
    // req.body.country = 234;

    let key = req.body.clientid;
    let charge_sms = false;
    
    console.log('[[====================================');
    console.log('OPT-IN DATA: ...' + JSON.stringify(req.body));
    console.log('====================================]]');

    try {
        //  get user details
        let user = await models.User.findOne({
            where: {
                api_key: key,
            }
        });

        if(!user) throw {
            name: 'requesterror',
        };

        if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw {
            name: 'phoneerror',
        };

        //  get user's optin preference
        let opt = await models.Customoptin.findByPk(user.id);
        let opt_grps;
        
        if(!opt) {
        console.log('00000000000000000000')
            await models.Customoptin.create({
                userId: user.id,
            })
            opt = await models.Customoptin.findByPk(user.id);
        }

        console.log('11111111111111111111111111 = ' + JSON.stringify(opt))
        if(opt && opt.optin_type == 'two-click') {   //  user has options set
            console.log('22222222222222')
            opt_grps = opt.optin_grps;

            this.completeOptin({
                body: {
                    twoclick: true,
                    groups: opt_grps,
                    sms: opt.optin_channels ? (opt.optin_channels.toString().split(',').includes('sms') ? "on" : null) : null,
                    whatsapp: opt.optin_channels ? (opt.optin_channels.toString().split(',').includes('whatsapp') ? "on" : null) : null,
                    firstname: req.body.fullname.split(' ')[0],
                    lastname: req.body.fullname.split(' ')[1],
                    phone: req.body.phone,
                    userId: user.id,
                    countryId: req.body.country,
                }
            }, res)
            return;
        }
        console.log('3333333333333333')

        //  get user's default [uncategorized] group id
        let grpid = await models.Group.findOne({
            where: {
                userId: user.id,
                name: '[Uncategorized]',
            },
            attributes: ['id']
        })
        
        let uniquecode = await randgen('misc', models.Contact, 5, 'fullalphnum');
        // let kont = await user.createTmpoptin({
        let kont = await models.Contact.create({
            firstname: req.body.fullname.split(' ')[0],
            lastname: req.body.fullname.split(' ')[1],
            phone: req.body.phone,
            userId: user.id,
            groupId: grpid.id,
            countryId: req.body.country,
            misc: uniquecode,
        })

        let newurl = env.SERVER_BASE + '/messages/optin?code='+uniquecode;
        let phone = phoneformat(req.body.phone, req.body.country);
        let body;

        let msgs = await models.Customoptin.findByPk(user.id);

        console.log('====================================');
        console.log('sgs= ' + JSON.stringify(msgs));
        console.log('sgs= ' + JSON.stringify(msgs.optin_msg1));
        console.log('====================================');
    
        //  get custom messages
        if(msgs && msgs.optin_msg1 && (msgs.optin_msg1.length > 0)) {
        console.log('sgs1');
            let snd = msgs.optin_msg1;
            body = snd
                .replace(/\[firstname\]/g,  req.body.fullname.split(' ')[0])
                .replace(/\[first name\]/g, req.body.fullname.split(' ')[0])
                .replace(/\[fullname\]/g,   req.body.fullname)
                .replace(/\[full name\]/g,  req.body.fullname)
                .replace(/\[companyname\]/g, user.business)
                .replace(/\[company name\]/g, user.business);
            body = body + ".\nClick " + newurl;
        } else {
        console.log('sgs2');
            body = _message('msg', 1050, req.body.country, req.body.fullname.split(' ')[0], newurl);
        }
    
    
        // let body = 'Hello ' + req.body.fullname.split(' ')[0] + 
        //            ', thanks for opting in to our WhatsApp platform. One last thing, please use this link to confirm and finish: ' + newurl;

        if(!user.wa_instanceurl || !user.wa_instancetoken) throw {
            name: 'integrationerror',
            del: kont
        };

        //  get notification channel
        if(opt.msg1_channels) {
            let arr = opt.msg1_channels.toString();
            arr = arr.split(',');
            arr.forEach(async a => {
                if(a == 'sms') {
                    let platform = 'infobip'; // user.sms_service 
                    let senderid = 'spaceba'; // 'tracksend'; // user.sms_service 
                    let new_resp = await sendSMS(platform, null, null, body, senderid, phone);
                    charge_sms = true;
                } else if(a == 'whatsapp') {
                    let new_resp = await whatsappSendMessage('message', phone, body, user.wa_instanceid, user.wa_instancetoken);
                }
            });
        } else {
            //  default notification channel
            let platform = 'infobip'; // user.sms_service 
            let senderid = 'spaceba'; // 'tracksend'; // user.sms_service 
            let new_resp = await sendSMS(platform, null, null, body, senderid, phone);
            charge_sms = true;
        }

        //  charge user for SMS
        if(charge_sms) {
            let sms_count = getSMSCount(body);
            let sms_charge = await getRateCharge(phone, req.body.country, user.id);
            
            let charge = sms_count * parseFloat(sms_charge);

            user.update({
                count: Sequelize.literal('balance - ' + charge),
            });
            //  LOG TRANSACTIONS
            await models.Transaction.create({
                description: 'DEBIT',
                userId: user.id,
                type: 'CONTACT OPT-IN NOTIFICATION',
                ref_id: phone,
                units: (-1) * charge,
            })
        }
        
        
        
        // res.sendStatus(200);
        res.send({
            status: "PASS",
            msg: "Successfully submitted. A confirmation message has been sent to you."
        }); 

    } catch(e) {
        console.error('====================================');
        console.error('erroooooooooooooer: ' + JSON.stringify(e.name));
        console.error('erroooooooooooooer: ' + e);
        console.error('====================================');
        if(e.name == 'SequelizeUniqueConstraintError') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1050, req.body.country),
            });
        }
        else if(e.name == 'requesterror') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1060, req.body.country),
            });
        }
        else if(e.name == 'phoneerror') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1070, req.body.country),
            });
        }
        else if(e.name == 'integrationerror') {
            e.del.destroy();
            res.send({
                status: "FAIL",
                msg: _message('error', 1010, req.body.country),
            });
        }
        return;
    }

}

//  clicking of optin link on whatsapp message lands here
exports.postOptin = async function(req, res) {

    let ucode = req.query.code || req.params.kid;
    console.log('code = ' + ucode);
    
    let kont = await models.Contact.findOne({
        where: {
            misc: ucode,
        },
        attributes: ['userId', 'countryId'],
    });

    if(kont == null) {
        console.log('ERROR IN CODE');
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    } 

    console.log('====================================');
    console.log('user id = ' + kont + '; json... ' + JSON.stringify(kont));
    console.log('====================================');

    let getgroups = await models.Group.findAll({
        where: {
            userId: kont.userId,
            can_optin: true,
        },
        attributes: ['id', 'name'],
    })

    console.log('====================================');
    console.log('groups ' + JSON.stringify(getgroups));
    console.log('====================================');

    //  get questions...if any
    let ques = await models.Customoptinquestion.findAll({
        where: {
            userId: kont.userId
        },
        raw: true,
    })

    if(ques) {
        ques = ques.map(q => {
            switch (parseInt(q.type)) {
                case 1:
                    q.openend = true;
                    break;
                case 2:
                    q.multichoice = true;
                    break;
                case 3:
                    q.polarque = true;
                    if(q.polartype == 'Yes-No') q.yesno = true;
                    if(q.polartype == 'True-False') q.truefalse = true;
                    break;
            
                default:
                    break;
            }
            return q;
        })
    }

    res.render('pages/dashboard/whatsappcompleteoptin', {
        _page: 'Message Opt-In',
        ucode,

        args: {
            grps: getgroups,
            _msg: _message('msg', 1051, kont.countryId),
            ques
        }
    });

}

//  submission of whatsapp confirmation form
exports.completeOptin = async function(req, res) {
    var phoneformat = require('../my_modules/phoneformat');

    let firstname, lastname, phone, userId, countryId, sms, whatsapp;
    let kont_, error;

    console.log('*********** twoklik 1 ****************');
    if(req.body.twoclick) {
        console.log('*********** twoklik 2 ****************');
        
        firstname = req.body.firstname;
        lastname = req.body.lastname;
        phone = req.body.phone;
        userId = req.body.userId;
        countryId = req.body.countryId;
        sms = req.body.sms && req.body.sms == 'on';
        whatsapp = req.body.whatsapp && req.body.whatsapp == 'on';

    } else {
        console.log('*********** non-two-klik ****************');
        let ucode = req.body.code;
        let kont = await models.Contact.findOne({
            where: {
                misc: ucode,
            },
        });
        if(!kont) {
            error = "requesterror";
        } else {
            kont_ = kont;
            firstname = kont.firstname;
            lastname = kont.lastname;
            phone = kont.phone;
            userId = kont.userId;
            countryId = kont.countryId;

            let opt = models.Customoptin.findByPk(userId);
            if(opt.optin_channels) {
                sms = opt.optin_channels.toString().split(',').includes('sms');
                whatsapp = opt.optin_channels.toString().split(',').includes('whatsapp');
            }
        }
    }
    let grps = req.body.groups;
    grps = Array.isArray(grps) ? grps : grps.split(',');

    //  get new contact's saved details
    try {
        if(error) throw error;
        //  create contact-group records
        var ques_saved = false;
        await grps.forEach(async grp => {
            
            try {
                let newk = await models.Contact.create({
                    firstname,
                    lastname,
                    phone,
                    userId,
                    groupId: grp,
                    countryId,
                    do_whatsapp: whatsapp ? 1 : 0,
                    do_sms: sms,
                });
                
                //  check for questions and responses
                if(req.body.question && !ques_saved) {
                    var qi = 0;
                    req.body.question.forEach(async q => {
                        await models.Customcontactresponse.create({
                            contactId: newk.id,
                            customoptinquestionId: q,
                            response: req.body['question_'+qi++],
                        })
                        
                        // qi++;
                    });
                    ques_saved = true;
                }

            } catch(e) {
                
                if(e.name == 'SequelizeUniqueConstraintError') {
                    
                    try{
                        await models.Contact.update(
                            {
                                do_whatsapp: 1
                            },
                            {
                                where: {
                                    userId: userId,
                                    groupId: grp,
                                    countryId: countryId,
                                    phone: phone,
                                }
                            }
                        )
                    } catch(e) {
                        
                        console.error('====================================');
                        console.error('inside inside error' + JSON.stringify(e));
                        console.error('====================================');
                    }
                }
            }
        });
        console.log('after insert/update');
       
        // console.log('grps = ' + grps.length + 'grps = ' + (newk));
    



        //  delete contact's uncategorized record
        // let killk = await models.Contact.findByPk(kont.id);
        console.log('pre kill');
        if(kont_) await kont_.destroy();
        console.log('after destroy');

        //  send success message to user
        let user = await models.User.findByPk(userId);
        let phone_ = phoneformat(phone, countryId);
        let body, charge_sms = false;

        if(req.body.twoclick) {
            res.send({
                status: "PASS",
                msg: "Opt-in successful. Thank you."
            }); 
        } else {
            console.log('++++++++++++++++++++++');
            //  get custom messages
            let opt = await models.Customoptin.findByPk(user.id);
        
            console.log('====================================');
            console.log('sgs= ' + JSON.stringify(opt));
            console.log('====================================');
        
            if(opt && opt.optin_msg2 && opt.optin_msg2.length > 0) {
                let snd = opt.optin_msg2;
                body = snd
                    .replace(/\[firstname\]/g, firstname)
                    .replace(/\[fullname\]/g, firstname + ' ' + lastname)
                    .replace(/\[companyname\]/g, user.business);
            } else {
                body = _message('msg', 1060, countryId, firstname, user.business);
            }

            //  get notification channel
            try {
                if(opt.msg2_channels) {
                    let arr = opt.msg2_channels.toString();
                    arr = arr.split(',');
                    arr.forEach(async a => {
                        if(a == 'sms') {
                            let platform = 'infobip'; // user.sms_service 
                            let senderid = 'spaceba'; // 'tracksend'; // user.sms_service 
                            let new_resp = await sendSMS(platform, null, null, body, senderid, phone);
                            charge_sms = true;
                        } else if(a == 'whatsapp') {
                            let new_resp = await whatsappSendMessage('message', phone, body, user.wa_instanceid, user.wa_instancetoken);
                        }
                    });
                } else {
                    //  default notification channel
                    let platform = 'infobip'; // user.sms_service 
                    let senderid = 'spaceba'; // 'tracksend'; // user.sms_service 
                    let new_resp = await sendSMS(platform, null, null, body, senderid, phone);
                    charge_sms = true;
                }

                //  charge user for SMS
                if(charge_sms) {
                    let sms_count = getSMSCount(body);
                    let sms_charge = await getRateCharge(phone, countryId, userId);
                    
                    let charge = sms_count * parseFloat(sms_charge);

                    user.update({
                        count: Sequelize.literal('balance - ' + charge),
                    });
                    //  LOG TRANSACTIONS
                    await models.Transaction.create({
                        description: 'DEBIT',
                        userId: userId,
                        type: 'CONTACT OPT-IN NOTIFICATION',
                        ref_id: phone,
                        units: (-1) * charge,
                    })
                }
            } catch(err) {
                console.log('====================================');
                console.log('eeeeeeeeeeeeeeeeeeeeeeeeee ' + err);
                console.log('====================================');
            }


            res.render('pages/dashboard/whatsappcompleteoptin', {
                _page: 'WhatsApp Opt-In',
                
                args: {
                    grps: null,
                    _msg: _message('msg', 1052, countryId),
                }
            });
        }
    } catch(e) {
        if(e.name == 'SequelizeUniqueConstraintError') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1050, countryId),
            });
            return;
        }
        else if(e.name == 'requesterror') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1060, 234),
            });
            return;
        }
        else if(e.name == 'phoneerror') {
            res.send({
                status: "FAIL",
                msg: _message('error', 1070, countryId),
            });
            return;
        } else {
            console.error('====================================');
            console.error('ERRORa: ' + JSON.stringify(e) + ' ... ' + e);
            console.error('====================================');
        }
    }

}

exports.preOptout = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
    let kid = req.params.kid;

    console.log('[[====================================');
    console.log('OPT-OUT DATA: ...' + kid);
    console.log('====================================]]');

    try {
        //  get user details
        let kont = await models.Contact.findByPk(kid, {
            include: [{
                model: models.User, 
                attributes: ['name', 'business']
            },{
                model: models.Group, 
                attributes: ['name']
            }],
        });

        if(!kont) throw {
            name: 'requesterror',
        };
        console.log('====================================');
        console.log('KONT DATA: ' + JSON.stringify(kont));
        console.log('====================================');
        let ctry = await models.Country.findAll({ 
            order: [ 
                ['name', 'ASC']
            ]
        })

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/whatsappcompleteoptout', {
            _page: 'WhatsApp Opt-Out',
            flashtype, flash,

            args: {
                ctry,
                kid,
                // groupname: kont.group.name,
                // username: kont.user.name,
                // business: kont.user.business,
                _msg: _message('msg', 1070, kont.countryId, kont.user.business, kont.group.name),
            }
        });

    } catch(e) {
        console.error('====================================');
        console.error('error: ' + e.name);
        console.error('error: ' + JSON.stringify(e));
        console.error('error: ' + e);
        console.error('====================================');
        res.render('pages/redirect-error', {
            page: '',
    
        });
    }

}

exports.postOptout = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
    
    try {
        //  get user details
        if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw {
            name: 'phoneerror',
        };

        let kid = req.body.code;
        let phone = req.body.phone;
        let ctry = req.body.country;

        console.log('[[====================================');
        console.log('KID: ...' + kid + '; PHONE = ' + phone + '; CTRY' + ctry);
        console.log('====================================]]');

        let kont = await models.Contact.findByPk(kid);

        if(!kont || (kont.phone != phone)) throw {
            name: 'invalidoperation',
        } 

        if(kont.do_whatsapp !== 1) throw {
            name: 'notsubscribed',
        } 
        

        await kont.update({
            do_whatsapp: 0
        });

        console.log('====================================');
        console.log('whatsapp status changed: result = ' + JSON.stringify(kont));
        console.log('====================================');

        //  register opt-out
        await models.Optout.create({
            contactId: kid,
            userId: kont.userId,
            platform: 'WhatsApp',
        })

        res.render('pages/whatsappcompleteoptout', {
            _page: 'WhatsApp Opt-Out',

            args: {
                _msg: _message('msg', 1080, req.body.country)
            }
        });

    } catch(e) {
        console.error('====================================');
        console.error('erroooooooooooooer: ' + JSON.stringify(e));
        console.error('====================================');
        let errmsg;
        if(e.name == 'SequelizeUniqueConstraintError') {
            errmsg = _message('error', 1010, req.body.country);
        }
        else if(e.name == 'invalidoperation') {
            errmsg = _message('error', 1080, req.body.country);
        }
        else if(e.name == 'phoneerror') {
            errmsg = _message('error', 1070, req.body.country);
        }
        else if(e.name == 'notsubscribed') {
            errmsg = _message('error', 1090, req.body.country);
        }

        req.flash('error', errmsg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);

    }

}

