var models = require('../models');
const sequelize = require('../config/cfg/db');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var campaignController = require('../controllers/CampaignController');
var whatsappController = require('../controllers/WhatsAppController');
var filelogger = require('../my_modules/filelogger');
var phoneval = require('../my_modules/phonevalidate');

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
                    "              ( SELECT COUNT(status) AS dnd        FROM contacts WHERE status = 2 AND groupId = :gid AND userId = :uid) t3 " , {
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

exports.saveGroup = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    models.Group.findByPk(req.body.id)
    .then(grp => {
        if(grp.userId == user_id) {
            grp.update({
                name: req.body.name,
                description: req.body.description,
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

exports.generateUrl = (req, res) => {
    
    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var uid, url = req.query.url;//, id = req.query.id;

    console.log('====================================');
    console.log("URL = " + url);
    console.log('====================================');
    uid = makeId(3);

    checkId(uid);

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
            checkId(uid);
        } else {
            if(req.query.id) {
                let shrt = await models.Shortlink.findByPk(req.query.id);
                await shrt.update({
                    shorturl: id,
                });
                await res.send({
                    id: req.query.id,
                    shorturl: id,
                });
            } else {
                let shrt = await models.Shortlink.create({
                    userId: user_id,
                    shorturl: id,
                    url: url,
                });
                res.send({
                    // shorturl: 'https://tns.go/' + id,
                    id: shrt.id,
                    shorturl: id,
                });
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


}

exports.analyseCampaign = async (req, res) => {

    var file_not_logged = true;
    
    try {
        var user_id = req.user.id;
        // var user_id = 10;
    } catch {
        res.send({
            response: "Error: You're not logged in.", 
        });
        return;
    }
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var HAS_FOLLOWUP = false;
    var msgcount = 0;
    var units = 0;
    var name = req.body.name;
    var groups = req.body.group;
    var message = req.body.message;
    var sender = req.body.sender;
    var shorturl = req.body.shorturl;
    var schedule = req.body.schedule;
    var datepicker = req.body.datepicker;
    var skip_dnd = req.body.skip_dnd;
    var tid = req.body.analysis_id;
    var condition = req.body.condition;
    var within_days = req.body.within_days;


    var skip = (req.body.skip_dnd && req.body.skip_dnd == "on");
    var utm = (req.body.add_utm && req.body.add_utm == "on");

    var cond_1     = (req.body.chk_followup_1 && req.body.chk_followup_1 == "on");
    var cond_2     = (req.body.chk_followup_2 && req.body.chk_followup_2 == "on");

    var unsub     = (req.body.add_optout && req.body.add_optout == "on");
    var dosub     = (req.body.add_optin && req.body.add_optin == "on");
    var tooptin   = (req.body.to_optin && req.body.to_optin == "on");
    var toawoptin = (req.body.to_awoptin && req.body.to_awoptin == "on");
    var toall     = (tooptin && toawoptin);
    var tonone    = (!tooptin && !toawoptin);

    var has_clicked = (condition.indexOf('clicked') === 0 && cond_1) || (condition.indexOf('clicked') === 1 && cond_2);
    var has_unclicked = (condition.indexOf('unclicked') === 0 && cond_1) || (condition.indexOf('unclicked') === 1 && cond_2);

    console.log('tonone='+tonone+'; tooptin='+tooptin+'; toawoptin='+toawoptin+'; toall='+toall);

    if(Array.isArray(sender)) {
        console.log('====================================');
        console.log('isaaray');
        console.log('====================================');
        HAS_FOLLOWUP = true;
        if(!Array.isArray(groups)) groups = [groups];
        groups  = [groups].concat(req.body.condition);
    } else {
        console.log('====================================');
        console.log('noarray');
        console.log('====================================');
        message = [message];
        sender = [sender];
        shorturl = [shorturl];
        if(!Array.isArray(groups)) groups = [[groups]];
    }

    var uid = 'xxx';
    var allresults = [];
    var contactslength = 0;
    var tids = [];
    var msgcount_ = {}, contactcount_ = {}, units_ = {};
    var all, bal, fin;
    var int = 0;

    // try {
        // if(!Array.isArray(groups)) groups = [groups];
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
            }
            else {
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

            /* else if(int === 2) {
                let contactcount_2;
                let units_2;
                if(condition == "clicked") {
                    contactcount_2 = ESTIMATED_CLICK_PERCENTAGE * contactcount_.main;
                    units_2 = ESTIMATED_CLICK_PERCENTAGE * units_.main;
                } else if(condition == "unclicked") {
                    contactcount_2 = ESTIMATED_UNCLICK_PERCENTAGE * contactcount_.main;
                    units_2 = ESTIMATED_UNCLICK_PERCENTAGE * units_.main;
                }
                let msgcnt = getSMSCount(message[2]);
                let msgcount_2 = msgcnt * contactcount_2;

                contactcount_ = {...contactcount_, ...{ first: 32 }};
                msgcount_ = {...msgcount_, ...{ first: msgcount_2 }};
                msgcount_.acc += msgcount_2;
                units_ = { ...units_, ...{ first: units_2 }};
                units_.acc += units_2;
            } */

            function getSMSCount(txt) {

                let len = txt.length;

                const SMS_SIZE_MSG1 = 160;
                const SMS_SIZE_MSG2 = 150;
                const SMS_SIZE_MSG3 = 150;
                const SMS_SIZE_MSG4 = 150;

                if(len <= SMS_SIZE_MSG1) {
                    return 1;
                } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2)) {
                    return 2;
                } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3)) {
                    return 3;
                } else if(len <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3 + SMS_SIZE_MSG4)) {
                    return 4;
                } else {
                    return 5;
                }
            }
            async function getCharge(prefix, ctry) {

                var res_charge = await sequelize.query(
                    "SELECT units FROM settingsuserbillings " +
                    "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                    "WHERE settingsuserbillings.userId = (:id) " +
                    "AND settingsnetworks.prefix = '" + prefix + "'", {
                        replacements: {id: user_id},
                    }
                );

                console.log('RES!!!' + JSON.stringify(res_charge));
                // console.log('RES!!!' + res_charge[0][0].units);

                if(res_charge[0][0] && res_charge[0][0].units) {
                    console.log('444444');
                    var results = res_charge[0][0].units;
                    
                } else {

                    let res_rcharge = await models.Settingsnetwork.findAll({
                        /* include: [{
                            model: models.Settingsdefaultbilling, 
                            attributes: ['units'], 
                            raw: true,
                            // through: { }
                        }], */
                        where: { 
                            prefix: prefix,
                            countryId: ctry,
                        },
                        attributes: ['unitscharge'], 
                        limit: 1,
                    });

                    console.log('RRES!!!' + JSON.stringify(res_rcharge));
                    console.log('RRES!!!' + res_rcharge.map((r) => r.unitscharge));
                    var results = res_rcharge.map((r) => r.unitscharge);

                    // return results_;
                    console.log('555555');
                }

                return results;
            }                                                     
            async function checkAndAggregate(kont) { 

                if(shorturl[0] ) {
                    var shorturl_ = await models.Shortlink.findByPk(shorturl[int]);
                }
                console.log('====================================');
                console.log('cmpan is: ' + message[int]) ;
                console.log('====================================');
                var message_  = message[int]
                    .replace(/\[firstname\]/g, kont.firstname)
                    .replace(/\[lastname\]/g, kont.lastname)
                    .replace(/\[email\]/g, kont.email)
                    .replace(/\[url\]/g, 'https://tsn.go/' + (shorturl_ ? shorturl_.shorturl : '') + '/' + uid)
                    // .replace(/\[url\]/g, 'https://tsn.go/' + shorturl.shorturl + '/' + uid)
                    .replace(/&nbsp;/g, ' ');

                let cc = getSMSCount(message_);
                msgcount += cc;

                if(file_not_logged) {
                    filelogger('sms', 'API Controller', 'analysing campaign', message_);
                    file_not_logged = false;
                }
                let prefix = kont.phone.substr(0, 4);
                let unit_ = await getCharge(prefix, kont.countryId);

                units += unit_ * cc;
                return unit_;

            }

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
                    skip_dnd:   (skip_dnd) ? skip_dnd : null,
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
                    skip_dnd:   (skip_dnd) ? skip_dnd : null,
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

            int++;
        }
        
        res.send({
            code: "SUCCESS",
            tmpid: fin[1],
            contactcount: contactcount_,
            msgcount: msgcount_,
            units: units_,
            balance: fin[0],
            followups: [cond_1 ? 1 : 0, cond_2 ? 1 : 0],
        });
        return;
    /* }
    catch (r) {
        console.log("0Error:: Please try again later: " + JSON.stringify(r));
        console.log("0Error:: Please try again later: " + r);
        res.send({
            code: "FAIL",
            response: "Error: Please try again later", 
        });
    } */


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
                mg.update({
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

exports.whatsAppOptIn = async (req, res) => {
    whatsappController.preOptIn(req, res);
}

