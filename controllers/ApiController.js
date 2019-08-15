var models = require('../models');
const sequelize = require('../config/cfg/db');
const CHARS_PER_SMS = 160;
const _ = require('lodash');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts.
exports.groupList = function(req, res) {
    res.send('NOT IMPLEMENTED: Contact list');
};

// Display detail page for a specific contact.
exports.getContacts = (req, res) => {

    var q;
    if(req.query.grp != -1) {
        
        if(req.query.txt) {
            console.log('yes ttt');
            
            q = sequelize.query(
                "SELECT * FROM contacts " +
                "WHERE (" + 
                    " firstname LIKE :tt OR " +
                    " lastname LIKE :tt OR " + 
                    " email LIKE :tt " +
                ") AND groupId = (:grp) " +
                "AND userId = (:usr) ",
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
            
            q = models.Group.findByPk(req.query.grp, {
                include: [{
                    model: models.Contact, 
                    // attributes: ['id', 'name', 'nameKh'], 
                    // through: { }
                }],
                where: { userId: req.user.id } 
            });
        }

        q.then(cg => {
            console.log(JSON.stringify(cg));
            
            res.send(cg); 
        });
    } else {

        if(req.query.txt) {
            console.log('yes ttt');
            
            q = sequelize.query(
                "SELECT * FROM contacts " +
                "WHERE (" + 
                    " firstname LIKE :tt OR " +
                    " lastname LIKE :tt OR " + 
                    " email LIKE :tt " +
                ") AND userId = :usr ",
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
        
            q = models.Contact.findAll({
                // raw: true,
                where: { 
                    userId: req.user.id, 
                } 
            });
        }

        q.then(cg => {
            console.log(cg);
            
            res.send(cg); 
        });
    }

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

exports.delContact = (req, res) => {
    var user_id = req.user.id;
    console.log('dele = ' + req.query.id);
    
        models.Contact.findByPk(req.query.id)
        .then(con => {
            if(con.userId == user_id) {
                con.destroy()
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

exports.generateUrl = (req, res) => {
    var user_id = req.user.id;

    var uid, url = req.query.url;

    uid = makeId(3);

    checkId(uid);

    function checkId(id) {
        models.Shortlink.findAll({
            where: { 
                shorturl: id,
                // status: 1,
            },
        }).then((e) => {
            if(e.length) {
                console.log(JSON.stringify(e));
                uid = makeId(3);
                checkId(uid);
            } else {
                if(req.query.id) {
                    models.Shortlink.findByPk(req.query.id)
                    .then((shrt) => {
                        shrt.update({
                            shorturl: id,
                        }).then(() => {
                            res.send({
                                id: req.query.id,
                                shorturl: id,
                            });
                        })
                    }) 
                } else {
                    models.Shortlink.create({
                        userId: user_id,
                        shorturl: id,
                        url: url,
                    })
                    .then((shrt) => {
                        res.send({
                            // shorturl: 'https://tns.go/' + id,
                            id: shrt.id,
                            shorturl: id,
                        });
                    })
                }
            }
        })
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

    if (groups != 0) {
        if(!Array.isArray(groups)) groups = [groups];
        console.log('group= ' + JSON.stringify(groups));
        
        //  extract group contacts
        models.Group.findAll({
            include: [{
                model: models.Contact, 
                ...(skip ? {where: {status: 0}} : {})
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

                var message  = req.body.message
                    .replace(/\[firstname\]/g, kont.firstname)
                    .replace(/\[lastname\]/g, kont.lastname)
                    .replace(/\[email\]/g, kont.email)
                    .replace(/\[url\]/g, 'https://tsn.go/' + req.body.myshorturl + '/' + uid)
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
                
                console.log('THE END!!! balance ' + JSON.stringify(bal));
                console.log('THE END!!!');

                let tid = req.body.analysis_id;

                if(tid == 0) {
                    var tt = await models.Tmpcampaign.create({
                        name: req.body.name,
                        description: req.body.description,
                        userId: user_id,
                        senderId: req.body.sender,
                        shortlinkId: (req.body.shorturlid.length > 0) ? req.body.shorturlid : null,
                        myshorturl: req.body.myshorturl,
                        grp: JSON.stringify(groups),
                        message: req.body.message,
                        schedule: null, //req.body.schedule,
                        recipients: req.body.recipients,
                        skip_dnd: (req.body.skip_dnd) ? req.body.skip_dnd : null,
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
                            shortlinkId: (req.body.shorturlid.length > 0) ? req.body.shorturlid : null,
                            myshorturl: req.body.myshorturl,
                            grp: JSON.stringify(groups),
                            message: req.body.message,
                            schedule: null, //req.body.schedule,
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
