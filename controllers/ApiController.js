var models      = require('../models');
const sequelize = require('../config/db');
var moment      = require('moment');
const _         = require('lodash');
const Sequelize = require('sequelize');
const Op        = Sequelize.Op;
const mongoose = require('mongoose');
var mongmodels = require('../models/_mongomodels');
const { default: axios } = require('axios');

var campaignController    = require('./CampaignController');
var perfcampaignController    = require('./PerfCampaignController');
var groupController       = require('./GroupController');
var contactController     = require('./ContactController');
var customOptinController = require('./CustomOptinController');
var whatsappController    = require('./WhatsAppController');
var msgOptinController    = require('./MessageOptinController');
var adminController       = require('./adminController');
var filelogger            = require('../my_modules/filelogger');
var phoneval              = require('../my_modules/phonevalidate');
var phoneformat           = require('../my_modules/phoneformat');
var apiAuthToken          = require('../my_modules/apitokenauth');
var getSMSCount           = require('../my_modules/sms/getSMSCount');
var getRateCharge         = require('../my_modules/sms/getRateCharge');
var smsSendEngines        = require('../my_modules/sms/smsSendEngines');
var whatsappSendMessage   = require('../my_modules/whatsappSendMessage');

const CHARS_PER_SMS = 160;
const ESTIMATED_CLICK_PERCENTAGE = 0.8;
const ESTIMATED_UNCLICK_PERCENTAGE = 1 - ESTIMATED_CLICK_PERCENTAGE;

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display Groups List Based on Selection of Group Type .. NOT DONE
exports.getGroups = async (req, res) => {

    return await groupController.getGroups(req, res);

}

// Display detail page for a specific contact.
exports.getContacts = async (req, res) => {

    return await contactController.getContacts(req, res);

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

    return await groupController.saveGroup(req, res);

}

exports.delGroup = async (req, res) => {

    return await groupController.delGroup(req, res);

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

exports.saveContact = async (req, res) => {

    return await contactController.saveContact(req, res);

}

exports.delContact = async (req, res) => {

    return await contactController.delContact(req, res);

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
        uid = makeId(5);

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
                uid = makeId(5);
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
    
    return await campaignController.analyse(req, res);

}

exports.sendPerfCampaign = async (req, res) => {
    
    return await perfcampaignController.send(req, res);

}
exports.updatePerfCampaign = async (req, res) => {
    
    return await adminController.updatePerfCampaign(req, res);

}

exports.reportPerfCampaign = async (req, res) => {
    
    return await perfcampaignController.report(req, res);

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
        mongmodels.Contact.count({   //  get count of contacts
            userId: user_id,
        }),                          //  consider adding the .exec() to make it full-fledged promise
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

exports.smsNotifyKirusa = (req, res) => {
    
    try {
        /* {
            “id”:” A10579090909090”,
            "status":"accepted",
            "ref_ids": [{“phone_number”:” 919886038842”,”ref_id”:"AC5ef8732a3c49700934481addd5ce1659”},{“phone_number”:” 919886038843”,”ref_id”:”BD6ef8732a3c49700934481addd5ce16560”}]
        } 
        
        rejected, sent, failed, delivered and undelivered.
        */

        console.log('[[====================================');
        console.log('KIRUSA RESPONSE...');  
        console.log('KIRUSA RESPONSE2: ' + JSON.stringify(req.body));
        console.log('====================================]]');

        if(req.body) {          //  for KIRUSA
            
            res.send({ response: "OK", data: req.body }); 
            
            var resp = (typeof req.body == "object") ? req.body : JSON.parse(req.body);
            if(resp.ref_ids) {};

            var cpgnid  = resp.id.split('-')[0];
            var phone   = resp.to;
            var status  = resp.status; 
            var dt_      = moment(resp.timestamp, "MMM DD, YYYY hh:mm:ss A Z");    //"Jul 20, 2020 9:49:44 AM WAT"
            var dt      = moment.utc(dt_).format('YYYY-MM-DD HH:mm:ss');    //"Jul 20, 2020 9:49:44 AM WAT"
            var dt__x   = moment.utc(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');    
            console.log('MOMENTS TIME = ', dt);
            
            var sid;
            
            let pref = phone.substr(0, 3);
            // let phn = '0' + phone.substr(3);
            let phn = phoneval(phone, pref);

            console.log('====================================');
            console.log('MSG STATUS = ' + status + "; phone = " + phone + "; pref = " + pref + "; phn = " + phn + "; cpgid = " + cpgnid);
            console.log('====================================');

            
            if (status == 'delivered') {
                sid = 1;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 1
                    },
                )

            } else if (status == 'rejected') {
                //  Kirusa rejects the SMS due to low balance, for instance
            } else if (status == 'failed') {
                sid = 3;    //  DND

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 2
                    },
                )

            } else if (status == 'undelivered') {
                sid = 4;    //  phone off, for instance

            } else {    //   not sure about anything about this option
                sid = 2;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 1
                    },
                )

            }

            if(!sid) return;
            
            models.Message.findOne({
                where: {
                    campaignId: cpgnid,
                    destination: "+" + resp.to,
                }
            })
            .then((mg) => {
                console.log('POST DB CHECK...');
                console.log('POST DB CHECK... = ' , JSON.stringify(mg));
                
                if(mg) mg.update({
                    status: sid,
                    ...( dt != "Invalid date" ? { deliverytime: dt, } : { deliverytime: dt__x, } ),
                })
                .then(() => {
                    // console.log('====================================');
                    // console.log('DOOOOOOOONNNNNNNNNNNNEEEEEEEEEEEEEE');
                    // console.log('====================================');
                })
            })


        } else {
            console.log("NO BODY!");
        }
    } catch(err) {
        console.log('CAUGHT ERROR: ' + err);
        res.send({ response: "OK...with errors", data: req.body })
    }
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
            var dt__x   = moment.utc(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');    
            var sid;

            if(status_ == "REJECTED_NOT_ENOUGH_CREDITS") return;
            
            let pref = phone.substr(0, 3);
            // let phn = '0' + phone.substr(3);
            let phn = phoneval(phone, pref);

            console.log('====================================');
            console.log('MSG STATUS = ' + status + "; phone = " + phone + "; pref = " + pref + "; phn = " + phn);
            console.log('====================================');


            if (status == 'DELIVERED') {
                sid = 1;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 1
                    },
                )
    
            } else if (status == 'REJECTED') {
                sid = 4;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 3
                    },
                )
                    
            } else if (status == 'UNDELIVERABLE') {
                sid = 3;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 2
                    },
                )
    
            } else {
                sid = 2;

                mongmodels.Contact.updateMany(
                    {
                        'country.id': pref,
                        phone: phn,
                    },
                    {
                        status: 1
                    },
                )
    
            }

            models.Message.findByPk(id)
            .then((mg) => {
                if(mg) mg.update({
                    status: sid,
                    ...( dt != "Invalid date" ? { deliverytime: dt, } : { deliverytime: dt__x, } ),
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

exports.smsNotifyMessagebird = (req, res) => {``
    
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
        var dt__x   = moment.utc(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');    
        var sid;

        console.log('====================================');
        console.log('MSG STATUS = ' + status);
        console.log('====================================');

        let pref = phone.substr(0, 3);
        // let phn = '0' + phone.substr(3);
        let phn = phoneval(phone, pref);

        if (status == 'delivered') {
            sid = 1;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 1
                },
            )

        } else if (status == 'delivery_failed') {
            sid = 4;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 3
                },
            )
            
        } else if (status == 'undeliverable') {
            sid = 3;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 2
                },
            )

        } else {
            sid = 2;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 1
                },
            )

        }

        models.Message.update(
            {
                status: sid,
                ...( dt != "Invalid date" ? { deliverytime: dt, } : { deliverytime: dt__x, } ),
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
    
    let seen = [];
    console.log('[[=============https://build.at-labs.io/docs/sms%2Fnotifications=======================');
    console.log('AFRICASTALKING RESPONSE GET: '  + JSON.stringify(req.query));
    console.log('AFRICASTALKING RESPONSE POST: ' + JSON.stringify(req.body));
    console.log('AFRICASTALKING RESPONSE ALL: ' + JSON.stringify(req, function (key, val) {
        if (val != null && typeof val == "object") {
            if (seen.indexOf(val) >= 0) {
                return;
            }
            seen.push(val);
        }
        return val;
    }) )
console.log('===============https://build.at-labs.io/docs/sms%2Fnotifications=====================]]');

    if(req.body) {          //  for AFRICASTALKING
    
        var resp = req.body;
        if(resp.ref_ids) {};

        var msgid  = resp.id;
        var phone   = resp.phoneNumber.substr(1);   //  exclude the '+'
        var status  = resp.status; 
        var dt_      = moment(resp.timestamp, "MMM DD, YYYY hh:mm:ss A Z");    //"Jul 20, 2020 9:49:44 AM WAT"
        var dt      = moment.utc(dt_).format('YYYY-MM-DD HH:mm:ss');    //"Jul 20, 2020 9:49:44 AM WAT"
        console.log('MOMENTS TIME = ', dt);
        
        var sid;
        
        let pref = phone.substr(0, 3);
        // let phn = '0' + phone.substr(3);
        let phn = phoneval(phone, pref);

        console.log('====================================');
        console.log('MSG STATUS = ' + status + "; phone = " + phone + "; pref = " + pref + "; phn = " + phn + "; cpgid = " + msgid);
        console.log('====================================');

        
        if (status == 'Success') {
            sid = 1;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 1
                },
            )

        } else if (status == 'Rejected') {
            sid = 4;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 3
                },
            )
            
        } else if (status == 'Failed') {
            sid = 3;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 2
                },
            )

        } else {
            sid = 2;

            mongmodels.Contact.updateMany(
                {
                    'country.id': pref,
                    phone: phn,
                },
                {
                    status: 1
                },
            )
        }

        if(!sid) return;
        
        models.Message.update({
            status: sid,
        }, {
            where: {
                message_id: msgid,
            }
        })
        .then((mg) => {
            console.log('POST DB CHECK...');
            console.log('POST DB CHECK... = ' , JSON.stringify(mg));
        })


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
        if(req.body.name && req.body.name.length > 0) {
            return await groupController.addGroup(req, res);
        }
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
        //  update group
        return await this.saveGroup(req, res);
        //  new group
        /* if(req.body.name && req.body.name.length > 0) {
            return await groupController.addGroup(req, res);
        } */
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

//  EXTERNAL API ACCESS
exports.newTxnMessage = async (req, res) => {

    try {

        let user_id; var _status;
        if(user_id = await apiAuthToken(req.body.token)) {

            let user_info = await models.User.findByPk(user_id, {
                attributes: ['balance', 'sms_service', 'wa_instanceid', 'wa_instancetoken'], 
                raw: true, 
            })
            req.user = { 
                id : user_id, 
                balance: user_info.balance, 
                sms_service: user_info.sms_service, 
                wa_instanceid: user_info.wa_instanceid, 
                wa_instancetoken: user_info.wa_instancetoken, 
            };
            let user_balance = user_info.balance;
            // let sms_service = user_info.sms_service;
            // req.user = { id: req.body.id };
            req.externalapi = true;
            req.txnmessaging = true;

            console.log('___**********____*******________**********_________balance=', user_balance);
            let file_not_logged = true;
            let msgcount = 0;
            let cost = 0;
            let message = req.body.message;
            let contacts = req.body.contacts;
            let sender = req.body.sender;
            let shorturl = req.body.shorturl;
            let url = req.body.url;
            let schedule = req.body.schedule;

            let schedule_ = schedule ? moment(schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : null;  //  for DB
            schedule = schedule ? moment(schedule, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.000Z') : null;   //  for infobip
    
            if(!Array.isArray(contacts)) contacts = [ contacts ];   // throw 'contacts';
            if(!message || !(message.length > 1)) throw 'message';

            if(req.body.type == "whatsapp") {

                for(let w = 0; w < contacts.length; w++) {
                    let kont = contacts[w], tophone, err_phone = 0;

                    //  { SEND_SINGLE_MESSAGES_TO_CHAT-API }
                    console.log('1 kont = ' + JSON.stringify(kont));
        
                    if(tophone = phoneformat(kont.phone, kont.countryId))
                    await whatsappSendMessage('message', tophone, req.body.message, req.user.wa_instanceid, req.user.wa_instancetoken, '', '', schedule_);
                    else err_phone++;
                }
                
            } else {

                if(!sender || !(sender.toString().length > 0)) throw 'sender';

                /* 
                * these extract actual ids of sender and group nd url stuff...particularly for externalapi
                */
                if(sender) {
                    let sender__ = await models.Sender.findOne({
                        where: {
                            userId: user_id,
                            name: sender,
                        },
                        attributes: ['id', 'name'],
                    })

                    if(!sender__) throw 'sender';
                    sender = sender__;
                    console.log('................sender='+JSON.stringify(sender));
                }

                let shortlink;
                if(shorturl) { 
                    let shorturl__ = await models.Shortlink.findByPk(shorturl);

                    if(!shorturl__) throw 'shorturl';
                    shortlink = shorturl__.shorturl;
                }

                if(url) {  //  if actual url is sent instead of shorturl id
                    req.query.url = url;
                    let resp = await this.generateUrl(req, res);
                    console.log('^^^^^^^^^^^^^^^^^^ ' + JSON.stringify(resp));
                    
                    if(!resp.error) {
                        shorturl = resp.id;
                    } else throw 'shorturl'
                }

                let HAS_SURL = shorturl ? true : false;
                
                //  check for personalizations
                let SINGLE_MSG = (message.search(/\[url\]/g) === -1) || !shorturl;

                // let SINGLE_MSG = !((message.search(/\[firstname\]/g) >= 0) ||
                //                  (message.search(/\[first name\]/g)  >= 0) || 
                //                  (message.search(/\[lastname\]/g)    >= 0) || 
                //                  (message.search(/\[last name\]/g)   >= 0) || 
                //                  (message.search(/\[email\]/g)       >= 0) || 
                //                  (message.search(/\[e-mail\]/g)      >= 0) || 
                //                  (message.search(/\[url\]/g)         >= 0));

                // if(!SINGLE_MSG && !shorturl) throw 'shorturl';

                message = message.replace(/&nbsp;/g, ' ');
                let message_  = message.replace(/\[url\]/g, 'https://tsn.go/' + shortlink + '/' + "XXX");

                let cc = getSMSCount(message_);
                msgcount += cc;

                for(let i = 0; i < contacts.length; i++) {
                    if(!contacts[i].phone || !contacts[i].countryId) throw 'contacts';
                    let chg = await getRateCharge(contacts[i].phone, contacts[i].countryId, user_id);
                    cost += cc * chg;
                }

                if(user_balance < cost) throw 'balance';

                if(file_not_logged) {
                    filelogger('sms', 'Transaction Message', 'sending message', message);
                    file_not_logged = false;
                }
        
                let info = {
                    userId:     user_id,
                    senderId:   sender.id,
                    shortlinkId: shorturl,
                    // myshorturl: req.body.myshorturl,
                    message:    message[0],
                    // schedule: (req.body.schedule) ? moment(req.body.schedule, 'DD/MM/YYYY h:mm:ss A').format('YYYY-MM-DD HH:mm:ss') : null, //req.body.schedule,
                    schedule:   schedule, //req.body.schedule,
                    skip_dnd:   null,
                    has_utm:    0,
                    to_optin:   0,
                    to_awoptin: 0,
                    add_optout: 0,
                    add_optin:  0,
                    cost,
                    total_cost: cost,
                    within_days: null,    
                    ref_campaign: null,
                }
            
                console.log('________________________SINGLE_MSG='+ JSON.stringify(SINGLE_MSG));
                _status = await smsSendEngines(
                    req, res,
                    user_id, user_balance, sender, info, contacts, schedule, schedule_, 
                    null, message, false, false, SINGLE_MSG, HAS_SURL
                );
                console.log('++++++++++++++++++++');
                console.log(JSON.stringify(_status));
                // return resp;
            }
        } else {
            _status = {
                response: "Error: Authentication error.", 
                responseType: "ERROR", 
                responseCode: "E001", 
                responseText: "Invalid Token", 
            };
        }

    } catch(err) {
        console.log('ERROR WA: ' + JSON.stringify(err));

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
                    response: "Error: Invalid Group Name.", 
                    responseType: "ERROR", 
                    responseCode: "E053", 
                    responseText: "Invalid Group Name.", 
                };
                break;
            case 'contacts':
                _status = {
                    response: "Error: Invalid Contacts (must be an array).", 
                    responseType: "ERROR", 
                    responseCode: "E052", 
                    responseText: "Invalid Contacts.", 
                };
                break;
            case 'message':
                _status = {
                    response: "Error: Invalid Message text (must not be empty).", 
                    responseType: "ERROR", 
                    responseCode: "E054", 
                    responseText: "Invalid Message.", 
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

exports.delPermission = async (req, res) => {
    adminController.deletePermission(req,res);
}

exports.delRole = async (req, res) => {
    adminController.deleteRole(req,res);
}

exports.savePermission = async (req, res) => {

    return await adminController.updatePermission(req, res);

}

exports.saveRole = async (req, res) => {

    return await adminController.updateRole(req, res);

}

exports.unassignRole = async (req, res) => {

    return await adminController.unassignRole(req, res);

}
//  EXTERNAL API ACCESS
exports.txnMessageStatus = async (req, res) => {

    try {

        var user_id, sts, _status;
        if(user_id = await apiAuthToken(req.query.token)) {

            let msgstatus = await models.Message.findByPk(req.query.id, {
                attributes: ['status', 'clickcount']
            });

            console.log(JSON.stringify(msgstatus));
            if(!msgstatus) throw 'invalid';

            switch (parseInt(msgstatus.status)) {
                case 0:
                    sts = "PENDING"
                    break;
                case 1:
                    sts = (msgstatus.clickcount > 0) ? "DELIVERED & CLICKED" : "DELIVERED"
                    break;
                case (2 || 3):
                    sts = "FAILED"
                    break;
                case 4:
                    sts = "UNDELIVERABLE"
                    break;
                case 5:
                    sts = "VIEWED"
                    break;
                case 5:
                                
                default:
                    break;
            }

            _status = {
                response: { id: req.query.id, status: sts }, 
                responseType: "OK", 
                responseCode: "P001", 
                responseText: "Message status successfully retrieved", 
            };
        } else throw 'auth';

    } catch(err) {
        console.log('ERROR WA: ' + err);

        switch(err) {
            case 'auth':
                _status = {
                    response: "Error: Authentication error.", 
                    responseType: "ERROR", 
                    responseCode: "E001", 
                    responseText: "Invalid Token", 
                };
                break;
            case 'invalid':
                _status = {
                    response: "Error: Invalid Message ID", 
                    responseType: "ERROR", 
                    responseCode: "E001", 
                    responseText: "Invalid Message ID", 
                };
                break;
            default:
                _status = {
                    response: "Error: General Error!", 
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

//  deprecated
exports.whatsAppOptIn = async (req, res) => {
    whatsappController.preOptIn(req, res);
}

exports.messageOptIn = async (req, res) => {
    msgOptinController.preOptIn(req, res);
}

