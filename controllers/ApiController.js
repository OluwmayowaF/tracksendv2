var models = require('../models');
const sequelize = require('../config/cfg/db');
var moment = require('moment');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display Groups List Based on Selection of Group Type .. NOT DONE
exports.getGroups = async (req, res) => {

    var user_id = req.user.id;
    var lnkgrp = req.params.lnkgrp;
    var gtype = req.query.grptype;

    var grps = await models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            mediatypeId: gtype
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
                        usr: req.user.id,
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
                        where: { userId: req.user.id },
                        limit: 100,
                        // attributes: ['id', 'name', 'nameKh'], 
                        // through: { }
                    }],
                    where: { userId: req.user.id } 
                }),
                sequelize.query(
                    "SELECT * FROM ( SELECT COUNT(status) AS unverified FROM contacts WHERE status = 0 AND groupId = :gid AND userId = :uid) t1, " +
                    "              ( SELECT COUNT(status) AS ndnd       FROM contacts WHERE status = 1 AND groupId = :gid AND userId = :uid) t2, " +
                    "              ( SELECT COUNT(status) AS dnd        FROM contacts WHERE status = 2 AND groupId = :gid AND userId = :uid) t3 " , {
                        replacements: {
                            gid: req.query.grp,
                            uid: req.user.id,
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
                        usr: req.user.id,
                    },
                    type: sequelize.QueryTypes.SELECT,
                },
            );
        } else {
            console.log('no tt');
        
            q = await models.Contact.findAll({
                // raw: true,
                where: { 
                    userId: req.user.id, 
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
    var user_id = req.user.id;

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
    var user_id = req.user.id;
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
    var user_id = req.user.id;

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
    var user_id = req.user.id;
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
    var user_id = req.user.id;
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
    var user_id = req.user.id;

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
    var user_id = req.user.id;
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
    var user_id = req.user.id;

    var uid, url = req.query.url;//, id = req.query.id;

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

exports.analyseCampaign = (req, res) => {

    try {
        var user_id = req.user.id;
    } catch {
        res.send({
            response: "Error: You're not logged in.",
        });
    }
    
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var msgcount = 0;
    var units = 0;
    var groups = req.body.group;
    var skip = (req.body.skip_dnd && req.body.skip_dnd == "on");
    var utm = (req.body.add_utm && req.body.add_utm == "on");

    if (groups != 0) {
        if(!Array.isArray(groups)) groups = [groups];
        console.log('group= ' + JSON.stringify(groups));
        
        //  extract group contacts
        models.Group.findAll({
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
        .then((dd) => {
            //  merge contacts from all groups

            var arr = [];
            dd.forEach(el => {
                arr = arr.concat(el.contacts);
            });

            //  remove duplicates
            arr = _.uniqBy(arr, 'phone');

            return arr;
        })
        .then(async (contacts) => {

            var uid = 'xxx';
            var allresults = [];

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

                var results = await sequelize.query(
                    "SELECT units FROM settingsuserbillings " +
                    "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                    "WHERE settingsuserbillings.userId = (:id) " +
                    "AND settingsnetworks.prefix = '" + prefix + "'", {
                        replacements: {id: user_id},
                    }
                )
                .then(async (res_charge) => {

                    console.log('RES!!!' + JSON.stringify(res_charge));
                    // console.log('RES!!!' + res_charge[0][0].units);

                    if(res_charge[0][0] && res_charge[0][0].units) {
                        console.log('444444');
                        return res_charge[0][0].units;
                        
                    } else {

                        let results_ = await models.Settingsnetwork.findAll({
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
                        })
                        .then((res_rcharge) => {
                            console.log('RRES!!!' + JSON.stringify(res_rcharge));
                            console.log('RRES!!!' + res_rcharge.map((r) => r.unitscharge));
                            return res_rcharge.map((r) => r.unitscharge);
                        })
                        .catch((err) => {
                            console.log('1ERROR!!!' + JSON.stringify(err));
                        });

                        return results_;
console.log('555555');
                    }

                })
                .error((r) => {
                    console.log("Error: Please try again later");
                    res.send({
                        response: "Error: Please try again later",
                    });
                })

                return results;
            }                                                     
            async function checkAndAggregate(kont) {  

                if(req.body.shorturl) {
                    var shorturl = await models.Shortlink.findByPk(req.body.shorturl);
                }
                console.log('====================================');
                console.log('cmpan is: ' + req.body.message) ;
                console.log('====================================');
                var message  = req.body.message
                    .replace(/\[firstname\]/g, kont.firstname)
                    .replace(/\[lastname\]/g, kont.lastname)
                    .replace(/\[email\]/g, kont.email)
                    .replace(/\[url\]/g, 'https://tsn.go/' + (shorturl ? shorturl.shorturl : '') + '/' + uid)
                    // .replace(/\[url\]/g, 'https://tsn.go/' + shorturl.shorturl + '/' + uid)
                    .replace(/&nbsp;/g, ' ');

                let cc = getSMSCount(message);
                msgcount += cc;

                let prefix = kont.phone.substr(0, 4);
                let unit_ = await getCharge(prefix, kont.countryId);

                units += unit_ * cc;
                return unit_;

            }

            for (let i = 0; i < contacts.length; i++) {
                allresults.push(await checkAndAggregate(contacts[i]));
            }

            Promise.all([
                allresults,
                models.User.findByPk((user_id), {
                    attributes: ['balance'],
                    raw: true
                })
            ])
            .then(async ([all, bal]) => {
                
                console.log('THE END!!! balance ' + JSON.stringify(req.body.schedule));
                console.log('THE END!!!' +  moment.utc(moment(req.body.schedule, 'YYYY-MM-DD HH:mm:ss')).format('YYYY-MM-DD HH:mm:ss'));

                let tid = req.body.analysis_id;

                if(tid == 0) {
                    var tt = await models.Tmpcampaign.create({
                        name: req.body.name,
                        description: req.body.description,
                        userId: user_id,
                        senderId: req.body.sender,
                        shortlinkId: (req.body.shorturl.length > 0) ? req.body.shorturl : null,
                        // myshorturl: req.body.myshorturl,
                        grp: JSON.stringify(groups),
                        message: req.body.message,
                        // schedule: (req.body.schedule) ? moment(req.body.schedule, 'DD/MM/YYYY h:mm:ss A').format('YYYY-MM-DD HH:mm:ss') : null, //req.body.schedule,
                        schedule: (req.body.datepicker) ? req.body.schedule : null, //req.body.schedule,
                        recipients: req.body.recipients,
                        skip_dnd: (req.body.skip_dnd) ? req.body.skip_dnd : null,
                        has_utm: (utm) ? 1 : 0,
                        units_used: units,
                    })
                    .then((tmp) => {
                        console.log('TP CREATED');
                        
                        return tmp.id;
                    })
                    .error((r) => {
                        console.log("3Error::: Please try again later: " + JSON.stringify(r));
                    })

                    return [bal.balance, parseInt(tt)];
                } else {
                    var tt = await models.Tmpcampaign.findByPk(tid)
                    .then((tp) => {
                        return tp.update({
                            name: req.body.name,
                            description: req.body.description,
                            userId: user_id,
                            senderId: req.body.sender,
                            shortlinkId: (req.body.shorturl.length > 0) ? req.body.shorturl : null,
                            // myshorturl: req.body.myshorturl,
                            grp: JSON.stringify(groups),
                            message: req.body.message,
                            schedule: (req.body.datepicker) ? req.body.schedule : null, //req.body.schedule,
                            recipients: req.body.recipients,
                            skip_dnd: (req.body.skip_dnd) ? req.body.skip_dnd : null,
                            units_used: units,
                        })
                        .then(() => {
                            return tid;
                        })
                        .error((r) => {
                            console.log("1Error::: Please try again later: " + JSON.stringify(r));
                        })
                    })
                    .error((r) => {
                        console.log("2Error::: Please try again later: " + JSON.stringify(r));
                    })

                    return [bal.balance, parseInt(tid)];
                }
                /* console.log('TT = ' + JSON.stringify(tt));
                

                return tt.then((tmpid) => {
                    console.log('TID = ' + JSON.stringify(tmpid));
                    
                    let bye = ;
                    console.log('post1... ' + JSON.stringify(bye));
                    
                    return bye;
                })
                .error((r) => {
                    console.log("4Error::: Please try again later: " + JSON.stringify(r));
                }) */
            })
            .then((fin) => {
                console.log('post2... ' + JSON.stringify(fin));
                
                res.send({
                        tmpid: fin[1],
                        msgcount,
                        contactcount: contacts.length,
                        units,
                        balance: fin[0],
                    });
            })
            .catch((r) => {
                console.log("0Error:: Please try again later: " + JSON.stringify(r));
                res.send({
                    response: "Error: Please try again later",
                });
            })
            
        })
        .error((r) => {
            console.log("00Error::: Please try again later: " + JSON.stringify(r));
            res.send({
                response: "Error: Please try again later",
            });
        })

        
    }

}

exports.loadCampaign = (req, res) => {

    
    const ACCUMULATE_CONTACTS = true;
    const ACCUMULATE_MESSAGES = true;

    var user_id = req.user.id;
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

exports.smsNotify = (req, res) => {
    
    console.log('[[====================================');
    console.log('INFOBIP RESPONSE: ' + JSON.stringify(req.body));
    console.log('====================================]]');

    
    var resp = req.body;
    resp.results.forEach(msg => {
        var id = msg.messageId;
        var phone = msg.to;
        var status = msg.status.groupName; 
        var dt = msg.sentAt;
        var sid;

        console.log('====================================');
        console.log('MSG STATUS = ' + status);
        console.log('====================================');

        let pref = phone.substr(0, 3);
        let phn = '0' + phone.substr(3);

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
                console.log('====================================');
                console.log('DOOOOOOOONNNNNNNNNNNNEEEEEEEEEEEEEE');
                console.log('====================================');
            })
        })

    });



}


