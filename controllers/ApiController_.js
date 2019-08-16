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
                where: { userId: req.user.id } 
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
                where: { userId: req.user.id } 
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

            /* if(req.body.skip_dnd && req.body.skip_dnd == "on") {
                var getconts = grp.getContacts({
                                        where: {
                                            status: 0
                                        }
                                    });
            } else {
                var getconts = grp.getContacts();
            } */
            grp.getContacts()
            .then((contacts) => {

                var uid = 'xxx';
console.log('11111');


                async function getUnitsUsed(results, prefix, ctry) {
console.log('333333');
                
                    //  first check if there's user-level billing
                    /* var results = await sequelize.query(
                        "SELECT units FROM settingsuserbillings " +
                        "JOIN settingsnetworks ON settingsuserbillings.settingsnetworkId = settingsnetworks.id " +
                        "WHERE settingsuserbillings.userId = (:id) " +
                        "AND settingsnetworks.prefix = '" + prefix + "'", {
                            replacements: {id: user_id},
                        }
                    );  */

                    if(!results.length) {
console.log('444444');
                        let charge = results.map((res) => res.units);
                        return charge;
                        
                    } else {
console.log('555555');
                        
                        console.log('NO USER-LEVEL');
                        let sett = await models.Settingsnetwork.findAll({
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
                        .catch((err) => {
                            console.log('ERROR!!!' + JSON.stringify(err));
                            
                        });
      
                            // console.log('billing setting is: ' + sett[0].settingsdefaultbillings.units);
                            // console.log('billing setting is: ' + JSON.stringify(sett[0].settingsdefaultbillings[0]));
console.log('666666');
                        return sett[0].unitscharge;
            
                        
                    }

                }

                function getCharge(prefix) {
                    console.log('222222bbbbbbbb00');
                                            
                    return models.Settingsuserbilling.findAll({
                        include: [{
                            model: models.Settingsnetwork,
                            where: {
                                prefix: prefix
                            },
                        }],
                        where: {
                            userId: user_id
                        }
                    })
                    .then((result) => {
                        console.log('RESULT!!!');
                        return result;
                    })
                    .catch((err) => {
                        console.log('ERROR!!!' + JSON.stringify(err));
                        
                    })
                }
                                         
                async function checkAndAggregate(kont) {  // opopopop

                    var message  = req.body.message
                        .replace(/\[firstname\]/g, kont.firstname)
                        .replace(/\[lastname\]/g, kont.lastname)
                        .replace(/\[email\]/g, kont.email)
                        .replace(/\[url\]/g, 'https://tsn.go/' + req.body.myshorturl + '/' + uid)
                        .replace(/&nbsp;/g, ' ');

                    var cc = Math.ceil(message.length/CHARS_PER_SMS);
                    msgcount += cc;
                    let nn = 3;

                    let prefix = kont.phone.substr(0, 4);
                    var results = await getCharge(prefix);

                    var unit_ = await getUnitsUsed(results, prefix, kont.countryId);
                    // units += unit_ * cc;
console.log('777777');
                    return unit_;
                    // resolve(message);
                    // return message;

                }

                    
                var actions = contacts.map(checkAndAggregate);
// console.log('000000');
                /* var actions = [];
                contacts.forEach(async (dd) => {
                    checkAndAggregate(dd);
                }); */

                Promise.all([actions]).then(([data]) => {
console.log('EEEEE');

                    // var  = data.length/CHARS_PER_SMS;
                    var contactcount = contacts.length;
                    var balance = 99;// bal.map((res) => res.balance);

                    console.log('msgs = ' + msgcount + '; contacts = ' + contactcount + '; units = ' + units + '; balance = ' + (balance));
                    
                    res.send({
                        msgcount,
                        contactcount,
                        units,
                        balance,
                    });

                })

            })
            .catch((err) => {
                console.log('ERROR!!!' + JSON.stringify(err));
                
            });

        })
        .catch((err) => {
            console.log('ERROR!!!' + JSON.stringify(err));
            
        })
}


}
