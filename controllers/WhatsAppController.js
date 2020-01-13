var models = require('../models');
const sequelize = require('../config/cfg/db');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var whatsappSendMessage = require('../my_modules/whatsappSendMessage');

exports.getQRCode = async (req, res) => {

    var { whatsAppRetrieveOrCreateInstance } = require('../my_modules/whatsappHandlers')();

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
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
    
    console.log('[[====================================');
    console.log('POST CHATAPI RESPONSE: ...');// + JSON.stringify(req.body));
    console.log('====================================]]');

    // res.sendStatus(200);
    res.send("ok");

}

exports.preOptIn = async (req, res) => {

    const randgen = require('../my_modules/randgen');
    var phoneval = require('../my_modules/phonevalidate');
    var phoneformat = require('../my_modules/phoneformat');

    //  for the sake of it, the only useful part of the 'clientid' is the third part of it... which is the client's userId
    let key = req.body.clientid;

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

        let newurl = 'https://dev2.tracksend.co/WhatsApp/optin?code='+uniquecode;
        let phone = phoneformat(req.body.phone, req.body.country);
        let body = 'Hello ' + req.body.fullname.split(' ')[0] + 
                   ', thanks for opting in to our WhatsApp platform. One last thing, please use this link to confirm and finish: ' + newurl;

        if(!user.wa_instanceurl || !user.wa_instancetoken) throw {
            name: 'integrationerror',
            del: kont
        };

        let new_resp = await whatsappSendMessage('message', phone, body, user.wa_instanceid, user.wa_instancetoken);

        // res.sendStatus(200);
        res.send("ok"); 

    } catch(e) {
        console.log('====================================');
        console.log('erroooooooooooooer: ' + JSON.stringify(e.name));
        console.log('erroooooooooooooer: ' + e);
        console.log('====================================');
        if(e.name == 'SequelizeUniqueConstraintError') {
            res.send({
                status: "error",
                msg: "Your opt-in request already submitted.",
            });
        }
        else if(e.name == 'requesterror') {
            res.send({
                status: "error",
                msg: "There's an error with your request, kindly contact website admin.",
            });
        }
        else if(e.name == 'phoneerror') {
            res.send({
                status: "error",
                msg: "There's an error the Phone Number, kindly check again.",
            });
        }
        else if(e.name == 'integrationerror') {
            e.del.destroy();
            res.send({
                status: "error",
                msg: "Error at Host, kindly contact website admin.",
            });
        }
        return;
    }

}

exports.postOptin = async function(req, res) {

    let ucode = req.query.code;
    console.log('code = ' + ucode);
    
    let uid = await models.Contact.findOne({
        where: {
            misc: ucode,
        },
        attributes: ['userId'],
    });

    if(uid == null) {
        console.log('ERROR IN CODE');
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    } 

    console.log('====================================');
    console.log('user id = ' + uid + '; json... ' + JSON.stringify(uid));
    console.log('====================================');

    let getgroups = await models.Group.findAll({
        where: {
            userId: uid.userId,
        },
        attributes: ['id', 'name'],
    })

    console.log('====================================');
    console.log('groups ' + JSON.stringify(getgroups));
    console.log('====================================');

    res.render('pages/dashboard/whatsappcompleteoptin', {
        _page: 'WhatsApp Opt-In',
        grps: getgroups,
        ucode,
    });


}

exports.completeOptin = async function(req, res) {

    var phoneformat = require('../my_modules/phoneformat');
    let ucode = req.body.code;
    console.log('code = ' + ucode + 'grps = ' + req.body.groups);
    
    try {
        //  get new contact's saved details
        let kont = await models.Contact.findOne({
            where: {
                misc: ucode,
            },
        });

        if(!kont) throw {
            name: "requesterror"
        }

        //  create contact-group records
        await req.body.groups.forEach(async grp => {
            try {
                await models.Contact.create({
                    firstname: kont.firstname,
                    lastname: kont.lastname,
                    phone: kont.phone,
                    userId: kont.userId,
                    groupId: grp,
                    countryId: kont.countryId,
                    do_whatsapp: true,
                });
            } catch(e) {
                if(e.name == 'SequelizeUniqueConstraintError') {
                    try{
                        await models.Contact.update(
                            {
                                do_whatsapp: true
                            },
                            {
                                where: {
                                    userId: kont.userId,
                                    groupId: grp,
                                    countryId: kont.countryId,
                                    phone: kont.phone,
                                }
                            }
                        )
                    } catch(e) {
                        console.log('====================================');
                        console.log('inside inside error' + JSON.stringify(e));
                        console.log('====================================');
                    }
                }
            }
        });
        console.log('after insert/update');
        
        //  delete contact's uncategorized record
        let killk = await models.Contact.findByPk(kont.id);
        console.log('pre kill');
        await killk.destroy();
        console.log('after destroy');
        
        //  send success message to user
        let user = await models.User.findByPk(kont.userId);
        let phone = phoneformat(kont.phone, kont.countryId);
        let body = 'Thanks ' + kont.firstname + '. Opt-in to ' + user.name + ' WhatsApp platform compeleted successfully.';
        let new_resp = await whatsappSendMessage('message', phone, body, user.wa_instanceid, user.wa_instancetoken);

        res.render('pages/dashboard/whatsappcompleteoptin', {
            _page: 'WhatsApp Opt-In',
            grps: null,
        });
    
    } catch(e) {
        if(e.name == 'SequelizeUniqueConstraintError') {
            res.send({
                status: "error",
                msg: "Your opt-in request already submitted.",
            });
            return;
        }
        else if(e.name == 'requesterror') {
            res.send({
                status: "error",
                msg: "There's an error with your request, kindly contact website admin.",
            });
            return;
        }
        else if(e.name == 'phoneerror') {
            res.send({
                status: "error",
                msg: "There's an error the Phone Number, kindly check again.",
            });
            return;
        } else {
            console.log('====================================');
            console.log('ERRORa: ' + JSON.stringify(e));
            console.log('====================================');
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
                groupname: kont.group.name,
                username: kont.user.name,
                business: kont.user.business,
            }
        });
    
    
    } catch(e) {
        console.log('====================================');
        console.log('error: ' + e.name);
        console.log('error: ' + JSON.stringify(e));
        console.log('error: ' + e);
        console.log('====================================');
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

        if(!kont.do_whatsapp) throw {
            name: 'notsubscribed',
        } 
        

        await kont.update({
            do_whatsapp: false
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

            args: {}
        });

    } catch(e) {
        console.log('====================================');
        console.log('erroooooooooooooer: ' + JSON.stringify(e));
        console.log('====================================');
        let errmsg;
        if(e.name == 'SequelizeUniqueConstraintError') {
            errmsg = "A system error occured. Please try again later";
        }
        else if(e.name == 'invalidoperation') {
            errmsg = "The phone number you provided does not match this request. Please check and try again.";
        }
        else if(e.name == 'phoneerror') {
            errmsg = "There's an error with the provide phone number Please check and try again.";
        }
        else if(e.name == 'notsubscribed') {
            errmsg = "You did not opt in for this Group's messages or had already opted out.";
        }

        req.flash('error', errmsg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);

    }

}

