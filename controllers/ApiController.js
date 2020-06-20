var models      = require('../models');
const sequelize = require('../config/cfg/db');
var moment      = require('moment');
const _         = require('lodash');
const Sequelize = require('sequelize');
const Op        = Sequelize.Op;

var campaignController    = require('./CampaignController');
var groupController       = require('./GroupController');
var contactController     = require('./ContactController');
var customOptinController = require('./CustomOptinController');
var whatsappController    = require('./WhatsAppController');
var msgOptinController    = require('./MessageOptinController');
var filelogger            = require('../my_modules/filelogger');
var phoneval              = require('../my_modules/phonevalidate');
var apiAuthToken          = require('../my_modules/apitokenauth');
var getSMSCount           = require('../my_modules/sms/getSMSCount');
var getRateCharge         = require('../my_modules/sms/getRateCharge');

const CHARS_PER_SMS = 160;
const ESTIMATED_CLICK_PERCENTAGE = 0.8;
const ESTIMATED_UNCLICK_PERCENTAGE = 1 - ESTIMATED_CLICK_PERCENTAGE;

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display Groups List Based on Selection of Group Type .. NOT DONE
exports.getGroups = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var lnkgrp = req.params.lnkgrp;
    var gtype = req.query.grptype;

    var grps = await models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: gtype
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    });

    if(gtype == 1) {
        var non = await models.Group.findAll({ 
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        });
    } else {
        var non = null;
    }

    if(non) grps.push(non[0]);

    res.send(grps); 

};

// Display detail page for a specific contact.
exports.getContacts = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var q;
    if(req.query.grp != -1) {
        
        if(req.query.txt) {
            console.log('yes ttt');
            
            q = await sequelize.query(
                "SELECT * FROM contacts " +
                "WHERE (" + 
                    " firstname LIKE :tt OR " +
                    " lastname LIKE :tt OR " + 
                    " phone LIKE :tt OR " +
                    " email LIKE :tt " +
                ") AND groupId = (:grp) " +
                "AND userId = (:usr) " +
                "LIMIT 100 ",
                {
                    replacements: {
                        tt: '%' + req.query.txt + '%',
                        grp: req.query.grp,
                        usr: user_id,
                    },
                    type: sequelize.QueryTypes.SELECT,
                },
            );
        } else {
            console.log('no tt');
            
            q = await Promise.all([
                    models.Group.findByPk(req.query.grp, {
                    include: [{
                        model: models.Contact, 
                        where: { userId: user_id },
                        limit: 100,
                        // attributes: ['id', 'name', 'nameKh'], 
                        // through: { }
                    }],
                    where: { userId: user_id } 
                }),
                sequelize.query(
                    "SELECT * FROM ( SELECT COUNT(status) AS unverified FROM contacts WHERE status = 0 AND groupId = :gid AND userId = :uid) t1, " +
                    "              ( SELECT COUNT(status) AS ndnd       FROM contacts WHERE status = 1 AND groupId = :gid AND userId = :uid) t2, " +
                    "              ( SELECT COUNT(status) AS dnd        FROM contacts WHERE status = 2 AND groupId = :gid AND userId = :uid) t3, " +
                    "              ( SELECT COUNT(do_sms) AS awoptin    FROM contacts WHERE do_sms = 0 AND groupId = :gid AND userId = :uid) t4, " +
                    "              ( SELECT COUNT(do_sms) AS optin      FROM contacts WHERE do_sms = 1 AND groupId = :gid AND userId = :uid) t5, " +
                    "              ( SELECT COUNT(do_sms) AS optout     FROM contacts WHERE do_sms = 2 AND groupId = :gid AND userId = :uid) t6 " , {
                        replacements: {
                            gid: req.query.grp,
                            uid: user_id,
                        },
                        type: sequelize.QueryTypes.SELECT,
                    }
                )
            ]);
        }

        res.send(q); 
        /* q.then((cg, conts) => {
            console.log(JSON.stringify(cg));
            
            res.send([cg, conts]); 
        }); */
    } else {

        if(req.query.txt) {
            console.log('yes ttt');
            
            q = await sequelize.query(
                "SELECT * FROM contacts " +
                "WHERE (" + 
                    " firstname LIKE :tt OR " +
                    " lastname LIKE :tt OR " + 
                    " phone LIKE :tt OR " +
                    " email LIKE :tt " +
                ") AND userId = :usr " +
                "LIMIT 100 ",
                {
                    replacements: {
                        tt: '%' + req.query.txt + '%',
                        usr: user_id,
                    },
                    type: sequelize.QueryTypes.SELECT,
                },
            );
        } else {
            console.log('no tt');
        
            q = await models.Contact.findAll({
                // raw: true,
                where: { 
                    userId: user_id, 
                },
                limit: 100,
            });
        }

        res.send(q); 
    }

}

// Display detail page for a specific contact.
exports.getClients = async (req, res) => {

    var q = req.query.q.term, r;
    
    console.log('yes ttt: ' + q);
    
    r = await sequelize.query(
        "SELECT id, name AS text FROM users " +
        "WHERE (" + 
            " id LIKE :tt OR " +
            " name LIKE :tt " + 
        ") " +
        "LIMIT 100 ",
        {
            replacements: {
                tt: '%' + q + '%',
            },
            type: sequelize.QueryTypes.SELECT,
        },
    );

    res.send({"results": r}); 
    

}

// Display detail page for a specific contact.
exports.saveSenderId = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    models.Sender.findByPk(req.body.id)
    .then(sndr => {
        if(sndr.userId == user_id) {
            sndr.update({
                name: req.body.name,
                description: req.body.description,
                status: 0,
            })
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    });
        

}

exports.delSenderId = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }
    console.log('dele = ' + req.query.id);
    
    models.Sender.findByPk(req.query.id)
    .then(sndr => {
        if(sndr.userId == user_id) {
            sndr.destroy()
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    });
        

}

exports.saveGroup = async (req, res) => {

    var msg;

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";

        // console.log('optin='+(req.body.can_optin && (req.body.can_optin == "on") ? 'yes' : 'no'))
        const grp = await models.Group.findByPk(req.body.id)
        if(grp.userId == user_id) {
            try {
                const r = await grp.update({
                    name: req.body.name,
                    description: req.body.description,
                    can_optin: (req.body.can_optin && req.body.can_optin == "on") ? true : false,
                })
                
                if(req.externalapi && req.body.contacts && req.body.contacts.length) {
                    req.body.group = req.body.id;
                    return await contactController.addContact(req, res);
                } else msg = "success";
            } catch(r) {
                msg = "Error: Please try again later"
            }
        } else {
            msg = "Error: Invalid permission";
        }
    } catch (e) {
        msg =  "Authentication Error!!!";
    }
        
    res.send({
        response: msg,
    });

}

exports.delGroup = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    console.log('dele = ' + req.query.id);
    
    models.Group.findByPk(req.query.id)
    .then(grp => {
        if(grp.userId == user_id) {
            grp.destroy()
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    });
        

}

exports.delCampaign = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    console.log('dele = ' + req.query.id);
    
    models.Campaign.findByPk(req.query.id)
    .then(cpn => {
        if(cpn.userId == user_id) {
            cpn.destroy()
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    })
    .catch((err) => {
        res.send({
            response: "Error: Please try again later.",
        });
    });
        

}

exports.saveContact = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    models.Contact.findByPk(req.body.id)
    .then(con => {
        if(con.userId == user_id) {
            con.update({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
            })
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    });
        

}

exports.delContact = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    console.log('dele = ' + req.query.id);
    
    //  get groups with the contact
    var con = await models.Contact.findByPk(req.query.id)
    if(con.userId == user_id) {
        try {
            await con.destroy();
            var grp = await models.Group.findByPk(con.groupId);
            await grp.update({
                count: Sequelize.literal('count - 1'),
            })
            res.send({
                response: "success",
            });
        }
        catch (r) {
            res.send({
                response: "Error: Please try again later",
            });
        }
    } else {
        res.send({
            response: "Error: Invalid permission",
        });
    }
        

}

exports.generateUrl = async (req, res) => {
    var send = { id: null, shorturl: null, error: null }

    try {
        try {
            var user_id = req.user.id;
            if(user_id.length == 0)  throw "auth";
        } catch(err) {
            throw 'auth';
        }

        var uid, url = req.query.url;//, id = req.query.id;

        console.log('====================================');
        console.log("URL = " + url);
        console.log('====================================');
        uid = makeId(3);

        await checkId(uid);

        async function checkId(id) {
            let e = await models.Shortlink.findAll({
                where: { 
                    shorturl: id,
                    // status: 1,
                },
            })
            
            if(e.length) {
                console.log(JSON.stringify(e));
                uid = makeId(3);
                await checkId(uid);
            } else {
                if(req.query.id) {
                    let shrt = await models.Shortlink.findByPk(req.query.id);
                    await shrt.update({
                        shorturl: id,
                    });
                    send.id = req.query.id;
                    send.shorturl = id;
                    /* await res.send({
                        id: req.query.id,
                        shorturl: id,
                    }); */
                } else {
                    let shrt = await models.Shortlink.create({
                        userId: user_id,
                        shorturl: id,
                        url: url,
                    });
                    send.id = shrt.id;
                    send.shorturl = id;
                    /* res.send({
                        // shorturl: 'https://tns.go/' + id,
                        id: shrt.id,
                        shorturl: id,
                    }); */
                }
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

    } catch (e) {
        console.log('wwwwwwwwwwwwwwwwwwwwwwwwww' + e);
        
        if(e == 'auth') {
            send.error = "Authentication Error!!!";
        } else {
            send.error = "An error occurred.";
        }
    }

    if(req.externalapi) {
        return send;
    }
    res.send(send);
}

exports.analyseCampaign = async (req, res) => {
    
    var _status = {};
    var file_not_logged = true;
    var is_api_access = req.externalapi;
    var HAS_FOLLOWUP = false;
    var user_id, msgcount, units, name, groups, groups_, message, sender, sender_, shorturl, schedule, datepicker, tid, condition, within_days;
    var skip, utm, cond_1, cond_2, unsub, dosub, tooptin, toawoptin, toall, tonone, has_clicked = false, has_unclicked = false;

    try {
        try {
            
            user_id = req.user.id;
            // user_id = 10;
            msgcount = 0;
            units = 0;
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

            cond_1    = (req.body.chk_followup_1 && req.body.chk_followup_1 == "on");
            cond_2    = (req.body.chk_followup_2 && req.body.chk_followup_2 == "on");

            unsub     = (req.body.add_optout && req.body.add_optout == "on");
            dosub     = (req.body.add_optin && req.body.add_optin == "on");
            tooptin   = (req.body.to_optin && req.body.to_optin == "on");
            toawoptin = (req.body.to_awoptin && req.body.to_awoptin == "on");
            toall     = (tooptin && toawoptin);
            tonone    = (!tooptin && !toawoptin);

            if(condition) {
                has_clicked = (condition.indexOf('clicked') === 0 && cond_1) || (condition.indexOf('clicked') === 1 && cond_2);
                has_unclicked = (condition.indexOf('unclicked') === 0 && cond_1) || (condition.indexOf('unclicked') === 1 && cond_2);
            }

            //  API ACCESS
            if(is_api_access) {
                console.log('___**********____*******________**********_________');
                
                // user_id = req.body.id;
                
                msgcount = 0;
                units = 0;
                name = req.body.name;
                message = req.body.message;
                groups_ = req.body.group;
                sender_ = req.body.sender;
                shorturl = req.body.shorturl;
                schedule = req.body.schedule;
                datepicker = req.body.datepicker;
                tid = [0, 0, 0];
                condition = [0, 0];
                within_days = [5, 5];

                skip = true;
                utm = true;

                cond_1    = false;
                cond_2    = false;

                unsub     = false;
                dosub     = false;
                tooptin   = true;
                toawoptin = true;
                toall     = (tooptin && toawoptin);
                tonone    = (!tooptin && !toawoptin);
                
                has_clicked = false;
                has_unclicked = false;

                //  extract actual ids of sender and group
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
                    let groups__ = await models.Group.findOne({
                        where: {
                            userId: user_id,
                            name: groups_,
                        },
                        attributes: ['id'],
                    })

                    if(!groups__) throw 'group';
                    groups = groups__.id
                    // console.log('................group='+groups.id);
                }
                if(req.body.url) {  //  if actual url is sent instead of shorturl id
                    req.query.url = req.body.url;
                    let resp = await this.generateUrl(req, res);
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

        if(Array.isArray(sender)) {
            console.log('====================================');
            console.log('isaaray');
            console.log('====================================');
            HAS_FOLLOWUP = true;
            if(!Array.isArray(groups)) groups = [groups];
            groups  = [groups].concat(req.body.condition);
        } else {
            message = [message];
            sender = [sender];
            shorturl = [shorturl];
            if(!Array.isArray(groups)) groups = is_api_access ? [groups] : [[groups]];
            console.log('====================================');
            console.log('noarray'+JSON.stringify(sender));
            console.log('====================================');
        }

        // console.log('----' + name.length + '----' + message[0].length + '----' + groups[0].toString().length + '----' + sender[0].toString().length);
        if(!name || !message || !groups || !sender) throw 'fields';
        if(!(name.length > 1) || !(message[0].length > 1) || !(groups[0].toString().length > 0) || !(sender[0].toString().length > 0)) throw 'fields';
        
        var uid = 'xxx';
        var allresults = [];
        var contactslength = 0;
        var tids = [];
        var msgcount_ = {}, contactcount_ = {}, units_ = {};
        var all, bal, fin;
        var int = 0;

        console.log('group= ' + JSON.stringify(groups));

        while(int < sender.length) {
            if((!cond_1 && int == 1) || (!cond_2 && int == 2)) {
                int++;
                continue;
            }
            if(tonone) throw {error: "nocontacts"};

            console.log('THE END!!! balance ' + JSON.stringify(schedule));
            console.log('THE END!!!' +  moment.utc(moment(schedule, 'YYYY-MM-DD HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss'));

            console.log('====================================');
            console.log('iiiiiiiiiiiiiiiiiiii = ' + int);
            console.log('====================================');
            if(int === 0) {  //  done only for the main campaign...followups would get only contact length from here
            //  extract groups contacts
                var dd = await models.Group.findAll({
                    include: [{
                        model: models.Contact, 
                        ...(
                            /* skip ? {
                                where: {
                                    status: {
                                            [Sequelize.Op.ne] : 2, 
                                    }
                                }
                            } : {} */
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
                                            do_sms: (tooptin ? 1 : 0)         //  opted-ins = 1; awaiting = 0
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
                                            do_sms: (tooptin ? 1 : 0  )       //  opted-ins = 1; awaiting = 0
                                        }
                                    )
                                }
                            }
                        )
                    }],
                    where: {
                        id: {
                            [Op.in]: groups[0],
                        },
                        userId: user_id,
                    },
                })

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

                name = [name];
                contactcount_ = { counts: [contactslength] };
                msgcount_ = { counts: [msgcount], acc: msgcount };
                units_ = { counts: [units], acc: units };
            } else {
                let contactcount_1;
                let units_1;
                if(condition[int-1] == "clicked") {
                    contactcount_1 = Math.round(ESTIMATED_CLICK_PERCENTAGE * contactcount_.counts[0]);
                    units_1 = Math.round(ESTIMATED_CLICK_PERCENTAGE * units_.counts[0]);
                } else if(condition[int-1] == "unclicked") {
                    contactcount_1 = Math.round(ESTIMATED_UNCLICK_PERCENTAGE * contactcount_.counts[0]);
                    units_1 = Math.round(ESTIMATED_UNCLICK_PERCENTAGE * units_.counts[0]);
                }
                let msgcnt = getSMSCount(message[int]);
                let msgcount_1 = Math.round(msgcnt * contactcount_1); 

                name.push(name[0] + "_(followup: " + condition[int - 1] + ")")
                contactcount_.counts.push(contactcount_1);
                msgcount_.counts.push(msgcount_1);
                msgcount_.acc += msgcount_1;
                units_.counts.push(units_1);
                units_.acc += units_1;
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
                    .replace(/\[firstname\]/g, kont.firstname)
                    .replace(/\[first name\]/g, kont.firstname)
                    .replace(/\[lastname\]/g, kont.lastname)
                    .replace(/\[last name\]/g, kont.lastname)
                    .replace(/\[email\]/g, kont.email)
                    .replace(/\[e-mail\]/g, kont.email)
                    .replace(/\[url\]/g, 'https://tsn.go/' + (shorturl_ ? shorturl_.shorturl : '') + '/' + uid)
                    // .replace(/\[url\]/g, 'https://tsn.go/' + shorturl.shorturl + '/' + uid)
                    .replace(/&nbsp;/g, ' ');

                let cc = getSMSCount(message_);
                msgcount += cc;

                if(file_not_logged) {
                    filelogger('sms', 'API Controller', 'analysing campaign', message_);
                    file_not_logged = false;
                }

                let unit_ = await getRateCharge(kont.phone, kont.countryId, user_id);

                units += unit_ * cc;
                return unit_;

            }

            if(!is_api_access) {
                let nint = (int == 2 && condition[0] == 0) ? int - 1 : int;
                if(tid[int] == 0) {
                    var tt = await models.Tmpcampaign.create({
                        name:       name[nint],
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
                        units_used: units,
                        total_units: units + (has_clicked ? units * ESTIMATED_CLICK_PERCENTAGE : 0) + (has_unclicked ? units * ESTIMATED_UNCLICK_PERCENTAGE : 0),
                        within_days: within_days[int-1],
                        ref_campaign: (int === 0) ? "" : "tmpref_" + tids[0],
                    });

                    tt = tt.id;
                } else {
                    var tp = await models.Tmpcampaign.findByPk(tid[int]);
                    var tt = await tp.update({
                        name:       name[nint],
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
                        units_used: units,
                        total_units: units + (has_clicked ? units * ESTIMATED_CLICK_PERCENTAGE : 0) + (has_unclicked ? units * ESTIMATED_UNCLICK_PERCENTAGE : 0),
                        within_days: within_days[int-1],
                        ref_campaign: (int === 0) ? "" : "tmpref_" + tids[0],
                    })

                    tt = tid[int];
                }
                
                tids.push(parseInt(tt)); 

                fin = [bal.balance, tids];

                console.log('post2... ' + JSON.stringify(fin));
            }
            
            int++;
        }
        
        console.log('====================================');
        console.log('END OF ANALYSIS!');
        console.log('====================================');
        if(is_api_access) {
            if(units_ > bal.balance) throw 'balance'
            let req_ = {
                body: {
                    // id: req.body.id,  
                    token: req.body.token,
                    analysis_id: ['api', 0, 0],
                    type: ['sms', 'sms', 'sms'],
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
                        units_used: units,
                        total_units: units,
                        within_days: null,    
                        ref_campaign: null,
                    }
                }
            }
            // console.log(JSON.stringify(req_));
            
            let resp = await campaignController.add(req_, res);
            console.log('3+++++++++++++'+resp);
            if(resp.status == "error") throw resp.msg;
            _status = resp;
        } else {
            _status = {
                code: "SUCCESS",
                tmpid: fin[1],
                contactcount: contactcount_,
                msgcount: msgcount_,
                units: units_,
                balance: fin[0],
                followups: [cond_1 ? 1 : 0, cond_2 ? 1 : 0],
            };
            // return;
        }

    } catch(err) {
        
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
            case 'fields':
                _status = {
                    response: "Error: Incomplete fields.", 
                    responseType: "ERROR", 
                    responseCode: "E003", 
                    responseText: "Check the fields for valid entries: 'name'; 'message'; 'sender'; 'group'.", 
                };
                break;
            case 'group':
                _status = {
                    response: "Error: Invalid Group ID.", 
                    responseType: "ERROR", 
                    responseCode: "E053", 
                    responseText: "Invalid Group ID.", 
                };
                break;
            case 'sender':
                _status = {
                    response: "Error: Invalid Sender ID.", 
                    responseType: "ERROR", 
                    responseCode: "E043", 
                    responseText: "Invalid Sender ID.", 
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

exports.loadCampaign = (req, res) => {

    
    const ACCUMULATE_CONTACTS = true;
    const ACCUMULATE_MESSAGES = true;

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var cmgnid = req.query.id;

    var nosenderids = false;
    var nocontacts = false;
    var nocampaigns = false;

    var acc_m = 0;    //  accumulating msgs
    var acc_c = 0;    //  accumulating msgs


    console.log('showing page...' + cmgnid); 
    
    
    Promise.all([
        sequelize.query(
            "SELECT * FROM ( SELECT COUNT(status) AS pending        FROM messages WHERE status = 0 AND campaignId = :cid ) t1," +
            "              ( SELECT COUNT(status) AS delivered      FROM messages WHERE status = 1 AND campaignId = :cid ) t2," +
            "              ( SELECT COUNT(status) AS failed         FROM messages WHERE status = 2 AND campaignId = :cid ) t3," +
            "              ( SELECT COUNT(status) AS undeliverable  FROM messages WHERE (status = 3 OR status = 4) AND campaignId = :cid ) t4," +
            "              ( SELECT SUM(clickcount) AS clicks       FROM messages WHERE campaignId = :cid ) t5," + 
            "              ( SELECT userId                          FROM campaigns WHERE id = :cid ) t6 " +
            "WHERE t6.userId = :id" , {
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
                limit: 5,
                order: [ 
                    ['createdAt', 'DESC']
                ],
                // attributes: ['id', 'name', 'nameKh'],
                // through: { }
            }], 
            order: [ 
                ['createdAt', 'DESC']
            ],
            limit: 1,
        }), 
        models.Contact.count({
            where: { 
                userId: user_id,
            }
        }), 
        /* models.Message.count({
            where: { 
                userId: user_id,
            }
        }),  */
        sequelize.query(
            "SELECT COUNT(messages.id) AS msgcount FROM messages " +
            "JOIN campaigns ON messages.campaignId = campaigns.id " +
            "WHERE campaigns.userId = :id ", {
                replacements: {
                    id: user_id,
                },
                type: sequelize.QueryTypes.SELECT,
            },
        ).then(([results, metadata]) => {
            console.log('unt is = ' + JSON.stringify(results));
           
            return results.msgcount;
        }),
    ]).then(([summary, messages, ccount, mcount]) => {
        console.log('qqq= '+messages.length);
        
        console.log('====================================');
        console.log('SUMM: ' + JSON.stringify(summary) + '; MESS: ' + JSON.stringify(messages) + '; CCONT: '+ JSON.stringify(ccount) + '; CMSG: ' + JSON.stringify(mcount));
        console.log('====================================');
        
        res.send({
            delivered: summary.delivered,
            pending: summary.pending,
            failed: summary.failed, 
            undeliverable: summary.undeliverable,
            clicks: summary.clicks,
            messages,
            ccount,
            mcount,
        });

    });

}

exports.saveOptinLink = (req, res) => {
    customOptinController.saveoptinlink(req, res);
}

exports.smsNotifyInfobip = (req, res) => {
    
    console.log('[[====================================');
    console.log('INFOBIP RESPONSE: ' + JSON.stringify(req.body));
    console.log('====================================]]');

    if(req.body) {          //  for INFOBIP
    
        var resp = req.body;
        resp.results.forEach(msg => {
            var id = msg.messageId;
            var phone = msg.to;
            var status_ = msg.status.name; 
            var status = msg.status.groupName; 
            var dt = msg.sentAt;
            var sid;

            console.log('====================================');
            console.log('MSG STATUS = ' + status);
            console.log('====================================');

            if(status_ == "REJECTED_NOT_ENOUGH_CREDITS") return;
            
            let pref = phone.substr(0, 3);
            // let phn = '0' + phone.substr(3);
            let phn = phoneval(phone, pref);


            if (status == 'DELIVERED') {
                sid = 1;

                models.Contact.update(
                    {
                        status: 1
                    },
                    {
                        where: {
                            countryId: pref,
                            phone: phn,
                        }
                    }
                )

            } else if (status == 'REJECTED') {
                sid = 4;

                models.Contact.update(
                    {
                        status: 3
                    },
                    {
                        where: {
                            countryId: pref,
                            phone: phn,
                        }
                    }
                )
                
            } else if (status == 'UNDELIVERABLE') {
                sid = 3;

                models.Contact.update(
                    {
                        status: 2
                    },
                    {
                        where: {
                            countryId: pref,
                            phone: phn,
                        }
                    }
                )

            } else {
                sid = 2;

                models.Contact.update(
                    {
                        status: 1
                    },
                    {
                        where: {
                            countryId: pref,
                            phone: phn,
                        }
                    }
                )

            }

            models.Message.findByPk(id)
            .then((mg) => {
                if(mg) mg.update({
                    deliverytime: dt,
                    status: sid,
                })
                .then(() => {
                    // console.log('====================================');
                    // console.log('DOOOOOOOONNNNNNNNNNNNEEEEEEEEEEEEEE');
                    // console.log('====================================');
                })
            })

        });

    } 

}

exports.smsNotifyMessagebird = (req, res) => {
    
    console.log('[[====================================');
    console.log('MESSAGEBIRD RESPONSE: ' + JSON.stringify(req.query));
    console.log('====================================]]');
    /* MESSAGEBIRD RESPONSE: {
        "id":"57b4844594de4f1392809a799c9ae855",
        "mccmnc":"62130",
        "ported":"0",
        "recipient":"2348033235527",
        "reference":"Testing_Refactoring_MessageBird_11",
        "status":"delivery_failed",
        "statusDatetime":"2020-02-12T15:06:43+00:00",
        "statusErrorCode":"5"
    } */
    /* MESSAGEBIRD RESPONSE: {
        "id":"8b9e6ed1072249718282a080fdde419e",
        "mccmnc":"62130",
        "ported":"0",
        "recipient":"2348033235527",
        "reference":"Testing_Refactoring_MessageBird_12 364369",
        "status":"delivered",
        "statusDatetime":"2020-02-12T15:18:47+00:00"
    } */


    if(req.query) {  //  for MESSAGEBIRD
        let msg = req.query;
        var id = msg.id;
        var phone = msg.recipient;
        var status = msg.status; 
        var dt = msg.statusDatetime;
        var sid;

        console.log('====================================');
        console.log('MSG STATUS = ' + status);
        console.log('====================================');

        let pref = phone.substr(0, 3);
        // let phn = '0' + phone.substr(3);
        let phn = phoneval(phone, pref);

        if (status == 'delivered') {
            sid = 1;

            models.Contact.update(
                {
                    status: 1
                },
                {
                    where: {
                        countryId: pref,
                        phone: phn,
                    }
                }
            )

        } else if (status == 'delivery_failed') {
            sid = 4;

            models.Contact.update(
                {
                    status: 3
                },
                {
                    where: {
                        countryId: pref,
                        phone: phn,
                    }
                }
            )
            
        } else if (status == 'undeliverable') {
            sid = 3;

            models.Contact.update(
                {
                    status: 2
                },
                {
                    where: {
                        countryId: pref,
                        phone: phn,
                    }
                }
            )

        } else {
            sid = 2;

            models.Contact.update(
                {
                    status: 1
                },
                {
                    where: {
                        countryId: pref,
                        phone: phn,
                    }
                }
            )

        }

        models.Message.update(
            {
                deliverytime: dt,
                status: sid,
            }, 
            {
                where: {
                    message_id: id
                }
            }
        ).then(() => {
            // console.log('====================================');
            // console.log('DOOOOOOOONNNNNNNNNNNNEEEEEEEEEEEEEE');
            // console.log('====================================');
        })


        // GET http://your-own.url/script?
        //      id=efa6405d518d4c0c88cce11f7db775fb&
        //      reference=the-customers-reference&
        //      recipient=31612345678&
        //      status=delivered&
        //      statusDatetime=2017-09-01T10:00:05+00:00

        res.send("OK");

    }

}

exports.smsNotifyAfricastalking = (req, res) => {
    
    console.log('[[====================================');
    console.log('AFRICASTALKING RESPONSE: ' + JSON.stringify(req.query));
    console.log('====================================]]');
    /* MESSAGEBIRD RESPONSE: {
        "id":"57b4844594de4f1392809a799c9ae855",
        "mccmnc":"62130",
        "ported":"0",
        "recipient":"2348033235527",
        "reference":"Testing_Refactoring_MessageBird_11",
        "status":"delivery_failed",
        "statusDatetime":"2020-02-12T15:06:43+00:00",
        "statusErrorCode":"5"
    } */
    /* MESSAGEBIRD RESPONSE: {
        "id":"8b9e6ed1072249718282a080fdde419e",
        "mccmnc":"62130",
        "ported":"0",
        "recipient":"2348033235527",
        "reference":"Testing_Refactoring_MessageBird_12 364369",
        "status":"delivered",
        "statusDatetime":"2020-02-12T15:18:47+00:00"
    } */


    if(req.query) {  //  for MESSAGEBIRD

        // GET http://your-own.url/script?
        //      id=efa6405d518d4c0c88cce11f7db775fb&
        //      reference=the-customers-reference&
        //      recipient=31612345678&
        //      status=delivered&
        //      statusDatetime=2017-09-01T10:00:05+00:00

        res.send("OK");

    }

}

exports.getWhatsAppQRCode = async (req, res) => {
    whatsappController.getQRCode(req, res);
}

exports.whatsAppNotify = (req, res) => {
    whatsappController.notifyAck(req, res);
}

//  EXTERNAL API ACCESS
exports.newGroup = async (req, res) => {

    let _id;
    if(_id = await apiAuthToken(req.body.token)) {
        req.user = {id : _id};
        req.externalapi = true;
        groupController.addGroup(req, res);
    } else {
        res.send({
            response: "Error: Authentication error.", 
            responseType: "ERROR", 
            responseCode: "E001", 
            responseText: "Invalid Token", 
        });
    }
} 
//  EXTERNAL API ACCESS
exports.updateGroup = async (req, res) => {

    let _id;
    if(_id = await apiAuthToken(req.body.token)) {
        req.user = {id : _id};
        req.externalapi = true;
        if(req.body.name && req.body.name.length > 0) {
            return await this.saveGroup(req, res);
        }
        if(req.body.contacts && Array.isArray(req.body.contacts) && req.body.contacts.length > 0) {
            return await groupController.addGroup(req, res);
        }
    }

    res.send({
        response: "Error: Authentication error.", 
        responseType: "ERROR", 
        responseCode: "E001", 
        responseText: "Invalid Token", 
    });
} 
//  EXTERNAL API ACCESS
exports.newCampaign = async (req, res) => {

    let _id;
    if(_id = await apiAuthToken(req.body.token)) {
        req.user = {id : _id};
        // req.user = { id: req.body.id };
        req.externalapi = true;
        this.analyseCampaign(req, res);
    } else {
        res.send({
            response: "Error: Authentication error.", 
            responseType: "ERROR", 
            responseCode: "E001", 
            responseText: "Invalid Token", 
        });
    }
}

//  deprecated
exports.whatsAppOptIn = async (req, res) => {
    whatsappController.preOptIn(req, res);
}

exports.messageOptIn = async (req, res) => {
    msgOptinController.preOptIn(req, res);
}

