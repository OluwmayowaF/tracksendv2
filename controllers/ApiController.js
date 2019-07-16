var models = require('../models');
const sequelize = require('../config/db');
const CHARS_PER_SMS = 160;

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

            getconts.then((contacts) => {

                var uid = 'xxx';

                var fn = async function checkAndAggregate(kont) {
                    // return new Promise(resolve => {

                        var message  = req.body.message
                        .replace(/\[firstname\]/g, kont.firstname)
                        .replace(/\[lastname\]/g, kont.lastname)
                        .replace(/\[email\]/g, kont.email)
                        .replace(/\[url\]/g, 'https://tsn.go/' + req.body.myshorturl + '/' + uid)
                        .replace(/&nbsp;/g, ' ');
    
                        var cc = Math.ceil(message.length/CHARS_PER_SMS);
                        msgcount += cc;
                        var unit_ = await getUnitsUsed(kont.phone, kont.countryId);
                        units += unit_ * cc;
                        console.log('msg = ' + message + '; units used: ' + unit_ * cc);
                        
                        // resolve(message);
                        return message;

                        function getUnitsUsed(ph, ctry) {
                            return new Promise(resolve => {
                                var prefix = ph.substr(0, 4);
                                console.log('network prefix is: ' + prefix);
                            
                                //  first check if there's user-level billing
                                sequelize.query(
                                    "SELECT units FROM settingsuserbillings " +
                                    "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                                    "WHERE settingsuserbillings.userId = (:id) " +
                                    "AND settingsnetworks.prefix = '" + prefix + "'", {
                                        replacements: {id: user_id},
                                    }
                                ).then(([results, metadata]) => {

                                    // console.log('results ===' + charge);
                                    
                                    //  if user-level is set up
                                    if(results.length) {
                                        console.log('YES USER-LEVEL');
                                        var charge = results.map((res) => res.units);
                                        
                                        resolve(charge);
                                        
                                    } else {
                                        
                                        console.log('NO USER-LEVEL');
                                        models.Settingsnetwork.findAll({
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
                                        }).then(sett => {
                                            
                                            // console.log('billing setting is: ' + sett[0].settingsdefaultbillings.units);
                                            // console.log('billing setting is: ' + JSON.stringify(sett[0].settingsdefaultbillings[0]));
                                            console.log('billing setting is: ' + JSON.stringify(sett[0].unitscharge));
                                            resolve(sett[0].unitscharge);
                            
                                        });

                                    }
                                });
                            })
                        }
                    // })
                }

                /* var balance = async function (resolve) {
                    // return new Promise(resolve => {

                        return models.User.findAll({
                            where: {
                                id: user_id
                            },
                            attributes: ['balance']
                        })
                        .then((bal) => {
                            var ball = bal.map((res) => res.balance);
                            resolve(ball);
                        })
                                       // })
                } */

                var actions = contacts.map(fn);
                var results = Promise.all([actions, 
                    models.User.findAll({
                        where: {
                            id: user_id
                        },
                        attributes: ['balance'],
                        raw: true
                    })
                    .then((bal) => {
                        return bal; //[0];
                    })
               ]);

                results.then(([data, bal]) => {

                    // var  = data.length/CHARS_PER_SMS;
                    var contactcount = contacts.length;
                    var balance = bal.map((res) => res.balance);

                    console.log('msgs = ' + msgcount + '; contacts = ' + contactcount + '; units = ' + units + '; balance = ' + (balance));
                    
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
