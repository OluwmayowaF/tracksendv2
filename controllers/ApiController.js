var models = require('../models');
const sequelize = require('../config/db');
const SMS_SIZE_MSG1 = 160;
const SMS_SIZE_MSG2 = 150;
const SMS_SIZE_MSG3 = 150;
const SMS_SIZE_MSG4 = 150;

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts.
exports.groupList = function(req, res) {
    res.send('NOT IMPLEMENTED: Contact list');
};

// Display detail page for a specific contact.
exports.getContacts = (req, res) => {

    if(req.query.grp != -1) {
        models.Group.findByPk(req.query.grp, {
            include: [{
                model: models.Contact, 
                // attributes: ['id', 'name', 'nameKh'], 
                // through: { }
            }],
            // where: { id: req.query.grp } 
        }).then(cg => {
            res.send(cg); 
        });
    } else {
        models.Group.findAll({
            include: [{
                model: models.Contact, 
                // attributes: ['id', 'name', 'nameKh'], 
                // through: { }
            }],
            // where: { id: req.query.grp } 
        }).then(cg => {
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
    var user_id = req.user.id;

    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var msgcount = 0;
    var units = 0;
    var group = req.body.group;

    if (group !== 0) {
        //  extract group contacts
        models.Group.findByPk(group)
        .then((grp) => {
            console.log('CONSTACT ARE : ' + JSON.stringify(grp));
            
            if(!grp) return;

            if(req.body.skip_dnd && req.body.skip_dnd == "on") {
                var getconts = grp.getContacts({
                                        where: {
                                            status: 0
                                        }
                                    });
            } else {
                var getconts = grp.getContacts();
            }

            getconts.then(async function(contacts) {

                var message  = req.body.message;
                var uid = 'xxx';
                var prefix = '';
                var charge = null;
                // var msgcount;
                var cc = 0;
                console.error('000000000000000');

                var fn = function checkAndAggregate(kont) {
                    return new Promise(async function(resolve) {
                        console.error('1111111bbbbbbbbb');

                        message
                        .replace(/\[firstname\]/g, kont.firstname)
                        .replace(/\[lastname\]/g, kont.lastname)
                        .replace(/\[email\]/g, kont.email)
                        .replace(/\[url\]/g, 'https://tsn.go/' + req.body.myshorturl + '/' + uid)
                        .replace(/&nbsp;/g, ' ');
    
                        prefix = kont.phone.substr(0, 4);
                        var mc = function (ch) {
                            var msgs;
                            if(ch <= SMS_SIZE_MSG1) {
                                msgs = 1;
                            } else if(ch <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2)) {
                                msgs = 2;
                            } else if(ch <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3)) {
                                msgs = 3;
                            } else if(ch <= (SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3 + SMS_SIZE_MSG4)) {
                                msgs = 4;
                            } else {
                                message = message.substr(0, SMS_SIZE_MSG1 + SMS_SIZE_MSG2 + SMS_SIZE_MSG3 + SMS_SIZE_MSG4);
                                msgs = 4;
                            }
                            return msgs;
                        }
                        cc = mc(message.length);
                        console.error('22222222222222222222 ount = ' + cc);
                        msgcount += cc;


                        
                        // msgcount = mc(message.length);
                        // var unit_ = await getUnitsUsed(kont.phone, kont.countryId);
                        // console.error('22222222222222222222');
                        // return resolve;

                        console.error('333333333333333333333333');
                        var sql = sequelize.query(
                                        "SELECT units FROM settingsuserbillings " +
                                        "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                                        "WHERE settingsuserbillings.userId = (:id) " +
                                        "AND settingsnetworks.prefix = '" + prefix + "'", {
                                            replacements: {id: user_id},
                                        }
                                    );
                        sql.then((billing) => {
                            
                            console.error('333333333aaaaaaaaaaaaaaaaaaaa');

                            if(billing[0].length) {
                                console.log('YES USER-LEVEL' + JSON.stringify(billing));
                                let charge_ = billing[0].map((res) => {
                                    return res.units
                                });
                                console.error('444444444444444444444 harge = ' + charge_);
                                // charge = charge_;
                                return charge;
                                
                                console.error('555555555555555555 charge = ' + charge);
                                // return charge;
                                
                            } else {
                                console.error('66666666666666666666');
                                
                                console.log('NO USER-LEVEL');
                                return models.Settingsnetwork.findAll({
                                    where: { 
                                        prefix: prefix,
                                        countryId: kont.countryId,
                                    },
                                    attributes: ['unitscharge'], 
                                    limit: 1,
                                })
                                .then((sett) => {
                                        
                                    console.log('billing setting is: ' + JSON.stringify(sett[0].unitscharge));
                                    // return sett[0].unitscharge;
                                    let charge_ = sett[0].unitscharge;
                                    console.error('777777777777777777 harge = ' + charge_);
                                    // charge = charge_;
                                    return charge_;
                                    console.error('7777777777aaaaaaaa harge = ' + charge);

                                    // return charge;
                                    console.error('8888888888888888888888 charge = ' + charge);
                                    
                                })
                            }
                        })
                        .then((charge) => {
                            console.error('88888888888bbbbbbbb');
                            units += (charge * cc);
                            console.log('msg = ' + message + '; charge: ' + charge + '; msgcount: ' + msgcount + '; total used = ' + units);
                            console.log('network prefix is: ' + prefix);
                            // resolve(units);
                        })



                    })

                }

                var actions = contacts.map(fn);
                // var results = await contacts.map(fn);
                console.error('1111111111111111');
                // var actions = contacts.map(checkAndAggregate);
                var results = Promise.all(actions);
                // console.error('0000000bbbbbbbbbb');
                models.User.findAll({
                                where: {
                                    id: user_id
                                },
                                attributes: ['balance'],
                                raw: true
                            });
                        
                results.then((aggr) => {

                            console.error('9999999999999999999999');
                            console.error('WWWWWWWWWW - ' + aggr);
                        
                            // var  = data.length/CHARS_PER_SMS;
                            var contactcount = contacts.length;
                            var balance = 100;// bal.map((res) => res.balance); 

                            console.log('FINAL::: msgs = ' + msgcount + '; contacts = ' + contactcount + '; units = ' + units + '; balance = ' + (balance));
                            
                            res.send({
                                msgcount,
                                contactcount,
                                units,
                                balance,
                            });

                        })



            });
            
        })
    }


}
