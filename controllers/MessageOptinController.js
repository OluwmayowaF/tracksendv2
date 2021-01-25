var models = require('../models');
const sequelize = require('../config/db');
const mongoose   = require('mongoose');
const mongmodels = require('../models/_mongomodels');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { default: axios } = require('axios');

var whatsappSendMessage = require('../my_modules/whatsappSendMessage');
var _message = require('../my_modules/output_messages');
var env = require('../config/env');
var sendSMS = require('../my_modules/sms/sendSMS');
var getSMSCount = require('../my_modules/sms/getSMSCount');
var getRateCharge = require('../my_modules/sms/getRateCharge');
const getCountry = require('../my_modules/getcountry');


//  tsnwhatsappoptin api lands here
exports.preOptIn = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

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
        let grpid = await mongmodels.Group.findOne({
                userId: user.id,
                name: '[Uncategorized]',
        }, '_id')
        
        let uniquecode = await randgen('misc', mongmodels.Contact, 'mongo', 5, 'fullalphnum');
        // let kont = await user.createTmpoptin({

        let kont = await mongmodels.Contact.create({
            firstname: req.body.fullname.split(' ')[0],
            lastname:  req.body.fullname.split(' ')[1],
            phone:     req.body.phone,
            userId:    user.id,
            groupId:   mongoose.Types.ObjectId(grpid._id),
            country:   await getCountry(req.body.country),
            misc:      uniquecode,
        })

        let newurl = env.SERVER_BASE + '/messages/optin?tsncode='+uniquecode;
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
                .replace(/\[company name\]/g, user.business)

                .replace(/\[loyalty\]/g,    req.body.loyalty)
                .replace(/\[rank\]/g,       req.body.rank)
                .replace(/\[company\]/g,    req.body.company)
                .replace(/\[city\]/g,       req.body.city)
                .replace(/\[state\]/g,      req.body.state)
                .replace(/\[count\]/g,      req.body.count)
                .replace(/\[trip\]/g,       req.body.trip)
                .replace(/\[category\]/g,   req.body.category)
                .replace(/\[createdat\]/g,  req.body.createdAt);
                
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
                amount: (-1) * charge,
            })
        }
        
        
        
        // res.sendStatus(200);
        res.send({
            status: "PASS",
            msg: "Successfully submitted. A confirmation message has been sent to you."
        }); 

    } catch(e) {
        console.error('====================================');
        console.error('erroooooooooooooer: ' + JSON.stringify(e));
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

//  clicking of optin link on whatsapp/sms message lands here
exports.postOptin = async function(req, res) {

    var general = false, user_id, kont;
    let ucode;
    if(req.query.tsncode) {
        console.log('entry 1 (code)');
        
        ucode = req.query.tsncode;
    }
    if(req.params.smssubid) {
        console.log('entry 2a (smssubid)');
        
        ucode = req.params.smssubid;
    } 
    if(req.params.subid) {
        console.log('entry 2b (subid)');
        
        ucode = req.params.subid;
    } 
    if(req.params.optid) {
        console.log('entry 3 (optid)');
        
        ucode = req.params.optid;  //  general opt-in
    } 
    // let  || req.params.subid || req.params.optid;
    console.log('code = ' + ucode);
    
    var optlnk = req.params.optid
    if(optlnk) {
        general = true;
        let user = await models.Customoptin.findAll({
            where: {
                [Sequelize.Op.or]: [
                    {
                        optin_generallink: optlnk
                    },
                    {
                        ...( (optlnk === parseInt(optlnk))  ?
                            {
                                userId: optlnk
                            } :
                            {}
                        ),
                    }
                ],
            },
            attributes: ['userId']
        });
        if(user.length == 1) user_id = user[0].userId;
        else {
            console.log('ERROR IN CODE'+user.length);
            
            res.render('pages/redirect-error', {
                page: '',
        
            });
            return;
        }
    } else {
        kont = await mongmodels.Contact.findOne({
            _id: mongoose.Types.ObjectId(ucode)
        }, 'userId countryId');

        if(!kont) {
            console.log('ERROR IN CODE');
            
            res.render('pages/redirect-error', {
                page: '',
                validity: true,
        
            });
            return;
        } 

        user_id = kont.userId;
        console.log('====================================');
        console.log('user id = ' + kont + '; json... ' + JSON.stringify(kont));
        console.log('====================================');
    }

    let getgroups = await mongmodels.Group.find({
        userId: user_id,
        can_optin: true,
        name: {
            $ne : "[Uncategorized]",
        },
    }, '_id name')

    let ctry = await models.Country.findAll({ 
        where: {
            status: 1
        },
        order: [ 
            ['name', 'ASC']
        ]
    })

    console.log('====================================');
    console.log('groups ' + JSON.stringify(getgroups));
    console.log('====================================');

    //  get questions...if any
    let ques = await models.Customoptinquestion.findAll({
        where: {
            userId: user_id
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

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    console.log('==== ======= ========== exit message = ' + JSON.stringify(_message('msg', 1051, (general ? 234 : kont.country.id))));

    res.render('pages/dashboard/messagecompleteoptin', {
        layout: 'dashboard_blank',
        _page: 'Message Opt-In',
        flashtype, flash,
        ucode,

        args: {
            grps: getgroups,
            _msg: _message('msg', 1051, (general ? 234 : kont.country.id)),
            ques,
            general,
            ctry,
            user_id,
        }
    });

}

//  submission of message confirmation form
exports.completeOptin = async function(req, res) {
    var phoneformat = require('../my_modules/phoneformat');

    let firstname, lastname, phone, userId, countryId, sms, whatsapp;
    let custom = false, kont, kont_, error;

    console.log('*********** completeOptin ****************', JSON.stringify(req.body));

    try {

        if(req.body.twoclick) {
            console.log('*********** twoklik-optin ****************');
            
            firstname = req.body.firstname;
            lastname = req.body.lastname;
            phone = req.body.phone;
            userId = req.body.userId;
            countryId = req.body.countryId;
            sms = req.body.sms && req.body.sms == 'on';
            whatsapp = req.body.whatsapp && req.body.whatsapp == 'on';

        } else if(req.body.generaloptin) {        //  if through general link optin
            console.log('*********** general-link-optin ****************');

            custom = true;
            firstname = req.body.fullname.split(' ')[0];
            lastname = req.body.fullname.split(' ')[1];
            phone = req.body.phone;
            userId = req.body.user_id;
            countryId = req.body.country;
        } else {
            console.log('*********** double/complete-optin ****************');
            
            custom = true;
            let ucode = req.body.optinusercode;
            let kontt = await mongmodels.Contact.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(ucode),
                    }
                },
                {
                    $lookup: {
                        from: "groups", 
                        as: "group",
                        localField: "groupId",
                        foreignField: "_id"
                    },
                }
            ]);

            if(!kontt || (kontt.length == 0)) {
                error = "requesterror";
            } else {
                kont = kontt[0];
                console.log('___________kont=====', JSON.stringify(kont));
                
                kont_ = kont;
                firstname = kont.firstname;
                lastname = kont.lastname;
                phone = kont.phone;
                userId = kont.userId;
                countryId = kont.country.id;
            }
        }

        if(!error && custom) {
            console.log('__________custom');
            
            let opt = await models.Customoptin.findByPk(userId);
            if(opt.optin_channels) {
                sms = opt.optin_channels.toString().split(',').includes('sms');
                whatsapp = opt.optin_channels.toString().split(',').includes('whatsapp');
            }
        }

        //  get new contact's saved details
        if(error) throw error;
        console.log('_________no-error');

        let grps = req.body.groups;
        grps = Array.isArray(grps) ? grps : grps.split(',');

        //  create contact-group records
        var ques_saved = false;
        await grps.forEach(async grp => {
            console.log('________grp' + grps);
            
            try {
                let newk = await mongmodels.Contact.create({
                    firstname,
                    lastname,
                    phone,
                    userId,
                    groupId: mongoose.Types.ObjectId(grp),
                    country: await getCountry(countryId), 
                    do_whatsapp: whatsapp ? 1 : 0,
                    do_sms: sms,
                    ...(
                        sms ? {
                            smsoptintime: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        } : {}
                    ),
                });
                
                //  ZAPIER
                if(sms) {
                    let zap = await models.Zapiertrigger.findOne({
                        where: {
                            userId,
                            name: 'contactopts',
                        },
                        attributes: ['hookUrl'],
                    })

                    if(zap) {
                        let ret = await axios({
                            method: 'POST',
                            url: zap.hookUrl,
                            data: [{
                                id: newk._id,
                                contact_id: newk._id,
                                action: "optin",
                            }],
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        })
                    }
                }
                //  check for questions and responses
                if(req.body.question && !ques_saved) {
                    var qi = 0;
                    req.body.question.forEach(async q => {
                        await models.Customcontactresponse.create({
                            contactId: newk._id,
                            customoptinquestionId: q,
                            response: req.body['question_'+qi++],
                        })
                        
                        // qi++;
                    });
                    ques_saved = true;
                }

            } catch(e) {
                console.log('#_________' + e);
                if(e.name == 'SequelizeUniqueConstraintError') {
                    
                    try{
                        await mongmodels.Contact.findOneAndUpdate(
                            {
                                userId: userId,
                                groupId: grp,
                                countryId: countryId,
                                phone: phone,
                            },
                            {
                                do_whatsapp: 1
                            }
                        )
                    } catch(e) {
                        
                        console.error('====================================');
                        console.error('inside inside error' + JSON.stringify(e));
                        console.error('====================================');
                        throw e;
                    }
                }
                else {
                    throw e;
                }
            }
        });//.catch(e => { throw e });
        console.log('after insert/update');
       
        // console.log('grps = ' + grps.length + 'grps = ' + (newk));
    

        //  delete contact's uncategorized record
        // let killk = await models.Contact.findByPk(kont.id);
        console.log('pre kill');
        if(kont_ && kont_.group.name == "[Uncategorized]") {
            await mongmodels.Contact.deleteOne({
                _id: mongoose.Types.ObjectId(kont_._id),
            });
            console.log('after destroy');
        }

        //  send success message to user
        let user = await models.User.findByPk(userId);
        let phone_ = phoneformat(phone, countryId);
        let body, charge_sms = false;

        console.log('++++++++++phone_='+phone_);
        
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
                            let new_resp = await sendSMS(platform, null, null, body, senderid, phone_);
                            charge_sms = true;
                        } else if(a == 'whatsapp') {
                            let new_resp = await whatsappSendMessage('message', phone_, body, user.wa_instanceid, user.wa_instancetoken);
                        }
                    });
                } else {
                    //  default notification channel
                    let platform = 'infobip'; // user.sms_service 
                    let senderid = 'spaceba'; // 'tracksend'; // user.sms_service 
                    let new_resp = await sendSMS(platform, null, null, body, senderid, phone_);
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
                        amount: (-1) * charge,
                    })
                }
            } catch(err) {
                console.log('====================================');
                console.log('eeeeeeeeeeeeeeeeeeeeeeeeee ' + err);
                console.log('====================================');
                throw err;
            }

            console.log('==== ======= ========== exit message = ' + JSON.stringify(_message('msg', 1052, countryId)));

            res.render('pages/dashboard/messagecompleteoptin', {
                layout: 'dashboard_blank',
                _page: 'Message Opt-In',
                
                args: {
                    grps: null,
                    _msg: _message('msg', 1052, countryId),
                }
            });
        }
    } catch(e) {
        console.log('@_____________' + JSON.stringify(e));
        
        if((e.name == 'SequelizeUniqueConstraintError')  || (e.codeName == 'DuplicateKey')) {
            req.flash('error', 'Contact already exists');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
            /* res.send({
                status: "FAIL",
                msg: _message('error', 1050, countryId),
            }); */
            return;
        }
        else if(e.name == 'requesterror') {
            req.flash('error', 'An error occurred, please try again later.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
            /* res.send({
                status: "FAIL",
                msg: _message('error', 1060, 234),
            }); */
            return;
        }
        else if(e.name == 'phoneerror') {
            req.flash('error', 'Invalid phone/country entry');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
            /* res.send({
                status: "FAIL",
                msg: _message('error', 1070, countryId),
            }); */
            return;
        } else {
            console.error('====================================');
            console.error('ERRORa: ' + JSON.stringify(e) + ' ... ' + e);
            console.error('====================================');
            req.flash('error', 'An error occurred, please contact Admin.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
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
        let kontt = await mongmodels.Contact.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(kid), 
                }
            }, {
                $lookup: {
                    from: "groups", 
                    as: "group",
                    localField: "groupId",
                    foreignField: "_id"
                },
            }
        ]);

        /* let kont = await models.Contact.findByPk(kid, {
            include: [{
                model: models.User, 
                attributes: ['name', 'business']
            },{
                model: models.Group, 
                attributes: ['name']
            }],
        }); */

        if(!kontt || (kontt.length == 0)) throw {
            name: 'requesterror',
        };

        let kont = kontt[0];

        let usr_ = await models.User.findByPk(kont.userId, {
            attributes: ['name', 'business']
        })

        kont['user'] = usr_;

        console.log('====================================');
        console.log('KONT DATA: ' + JSON.stringify(kont));
        console.log('====================================');
        let ctry = await models.Country.findAll({ 
            where: {
                status: 1
            },
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

        console.log('==== ======= ========== exit message = ' + JSON.stringify(_message('msg', 1070, kont.country.id, kont.user.business, kont.group.name)));
        
        res.render('pages/messagecompleteoptout', {
            layout: 'dashboard_blank',
            _page: 'Message Opt-Out',
            flashtype, flash,

            args: {
                ctry,
                kid,
                // groupname: kont.group.name,
                // username: kont.user.name,
                // business: kont.user.business,
                _msg: _message('msg', 1070, kont.country.id, kont.user.business, kont.group.name),
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

        let kont = await mongmodels.Contact.findOne({ _id: mongoose.Types.ObjectId(kid) });

        if(!kont || (kont.phone != phone)) throw {
            name: 'invalidoperation',
        } 

        if(kont.do_whatsapp !== 1) throw {
            name: 'notsubscribed',
        } 
        
        await mongmodels.Contact.findOneAndUpdate({
            _id: mongoose.Types.ObjectId(kid)
        }, {
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

        console.log('==== ======= ========== exit message = ' + JSON.stringify(_message('msg', 1080, req.body.country)));

        res.render('pages/messagecompleteoptout', {
            layout: 'dashboard_blank',
            _page: 'Message Opt-Out',

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
        console.log('==== ======= ========== exit message = ' + JSON.stringify(errmsg));

        req.flash('error', errmsg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);

    }

}

