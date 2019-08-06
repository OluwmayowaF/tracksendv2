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

exports.analyseCampaign = async (req, res) => {
    var user_id = req.user.id;
    var kk = 0;
    var arr = [2, 4];
    var rrr = [];

    async function yy(el) {
        console.log('ooo');
        kk += el;
        var dd = await models.Settingsuserbilling.findAll({
            include: [{
                model: models.Settingsnetwork,
                where: {
                    prefix: '0803'
                },
            }],
            where: {
                userId: user_id
            }
        })
        .then(async (result) => {
            console.log('RESULT!!!' + result);

            let sett = await models.Settingsnetwork.findAll({
                /* include: [{
                    model: models.Settingsdefaultbilling, 
                    attributes: ['units'], 
                    raw: true,
                    // through: { }
                }], */
                where: { 
                    prefix: 0803,
                    countryId: 234,
                },
                attributes: ['unitscharge'],
                limit: 1,
            })
            .then(() => {
                console.log('DONE DONE DONE!!!');
                return 'DONE DONE DONE!!!';
                
            })
            .catch((err) => {
                console.log('ERROR!!!' + JSON.stringify(err));
                
            });

            return sett;

        })
        .catch((err) => { 
            console.log('ERROR!!!');
        })


        console.log('rrr');
        
        return dd; 
    }

    // arr.push(await yy());
    // arr.push(await yy());

    for (let i = 0; i < arr.length; i++) {
        rrr.push(yy(arr[i]));
    }
    
    console.log('uuu = uuu');


    Promise.all([rrr]).then((rr) => {
        console.log('done = ' + rr);
        console.log('done = ' + kk);
        res.send({gg: kk});
    })
    

}
