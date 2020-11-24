const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const { default: axios } = require('axios');

var phoneval = require('../my_modules/phonevalidate');
var models = require('../models');
// const { Server } = require('mongodb');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts
exports.contactList = async (req, res) => {
    var user_id = req.user.id;
    var lnkgrp = req.params.lnkgrp;
    // var defgtyp = null;


    /* var grptyps = await models.Platformtype.findAll({
        order: [ 
            ['id', 'ASC']
        ]
    }); */

    /* if(lnkgrp) {
        defgtyp = await models.Group.findByPk(lnkgrp, {
            attributes: ['platformtypeId']
        });
    } */


    var grps = await models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            }
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    });

    // var grps = req.db.collection('groups');


    var non = await models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: '[Uncategorized]',
        },
    });

    grps.push(non[0]);

    console.log('====================================');
    console.log(JSON.stringify(grps));
    console.log('====================================');
    res.render('pages/dashboard/contact_list', {
        page: 'CONTACTS',
        contactlist: true,

        args: {
            lnkgrp,
            grps,
        }
    });

};

// Display detail page for adding a specific contact.
exports.newContact = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})

    Promise.all([
        models.Group.findAll({ 
            where: { 
                userId: user_id,
                name: {
                    [Sequelize.Op.ne]: '[Uncategorized]',
                }
            },
            order: [ 
                ['createdAt', 'DESC']
            ]
        }), 
        models.Group.findAll({ 
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        }), 
        models.Country.findAll({ 
            order: [ 
                ['name', 'ASC']
            ]
        })
    ])
    .then(([grps, non, ctry]) => { 
        var ngrp = non[0].id;
        
        var flashtype, flash = req.flash('error');
        console.log('flashy = ' + JSON.stringify(flash) + JSON.stringify(flashtype));
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_contact', {
            page: 'CONTACTS',
            singleentry: true,
            newcontact: true,
            flashtype, flash,

            args: {
                grps,
                ngrp,
                ctry,
            }
        });
    });

}

// Handle contact create on POST.
exports.download = async (req, res) => {
    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Contacts');
    var style = workbook.createStyle({
        /* font: {
            color: '#FF0800',
            size: 12,
        }, */
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    })
    var user_id = req.user.id;
    var gid = req.params.gid;

    console.log('form details are now: ' + JSON.stringify(req.body)); 

    let q = await models.Contact.findAll({
        // raw: true,
        where: { 
            userId: user_id, 
            groupId: gid, 
        },
        include: [{
            model: models.Country, 
            attributes: ['name'], 
        },{
            model: models.Group, 
            attributes: ['name'], 
        }],
        attributes: [
            'firstname',
            'lastname',
            'phone',
            'email',
            'do_sms',
            'do_whatsapp',
            'status',
        ],
        order: ['firstname', 'lastname', 'phone']
    });

    console.log('____________q=' + JSON.stringify(q));
    
    worksheet.cell(1,1).string('First Name').style(style);
    worksheet.cell(1,2).string('Last Name').style(style);
    worksheet.cell(1,3).string('Phone').style(style);
    worksheet.cell(1,4).string('Country').style(style);
    worksheet.cell(1,5).string('Email').style(style);
    worksheet.cell(1,6).string('SMS?').style(style);
    worksheet.cell(1,7).string('WhatsApp?').style(style);
    worksheet.cell(1,8).string('Status?').style(style);
    var itr = 1;

    q.forEach(ii => {
        itr++;
         // let jj = JSON.stringify(ii);
         var i = JSON.parse(JSON.stringify(ii));
         var st = parseInt(i.status);
         var ds = parseInt(i.do_sms);
         var dw = parseInt(i.do_whatsapp);

         /* if(i.contact == null && i.destination.length > 0) {
             var ds = i.destination;
             let pp = '0' + ds.substr(-10);

             i.contact = {
                 firstname: '--',
                 lastname: '--',
                 phone: pp,
             }
         } */

         worksheet.cell(itr,1).string(i.firstname || '--').style(style);
         worksheet.cell(itr,2).string(i.lastname || '--').style(style);
         worksheet.cell(itr,3).string(i.phone).style(style);
         worksheet.cell(itr,4).string(i.country.name).style(style);
         worksheet.cell(itr,5).string(i.email || '--').style(style);
         
         switch (st) {
             case 0:
                 i.status = "Unverified"
                 break;
             case 1:
                 i.status = "Non-DND"
                 break;
             case 2:
                 i.status = "DND"
                 break;
             default:
                 break;
         }
         switch (ds) {
             case 0:
                 i.do_sms = "Awaiting Opt-in"
                 break;
             case 1:
                 i.do_sms = "Opted In"
                 break;
             case 2:
                 i.do_sms = "Opted Out"
                 break;
             default:
                 break;
         }
         switch (dw) {
             case 0:
                 i.do_whatsapp = "Awaiting Opt-in"
                 break;
             case 1:
                 i.do_whatsapp = "Opted In"
                 break;
             case 2:
                 i.do_whatsapp = "Opted Out"
                 break;
             default:
                 break;
         }

         worksheet.cell(itr,6).string(i.do_sms).style(style);
         worksheet.cell(itr,7).string(i.do_whatsapp).style(style);
         worksheet.cell(itr,8).string(i.status).style(style);
         
     });
     let timestamp_ = new Date();
     let timestamp = timestamp_.getTime();
     let newfile = 'tmp/downloads/' + q[0].group.name + '_' + timestamp + '.xlsx';

     await workbook.write(newfile, (err, status) => {
         if(err) console.log('_______________ERROR: ' + err);
         else res.download(newfile);
     });
     console.log('____________DONE');

}

// Handle contact create on POST.
exports.addContact = async (req, res) => {
    var contacts = [];
    var groupId, last_contactid;
    var err = { invalid: 0, duplicate: 0, total: 0 };
    var fl = { mtype: null, msg: '', code: '' };

    try {

        var user_id = req.user.id;

        //  CHECK IF USER HAS ZAPPIER TRIGGER INTEGRATED
        let zap = await models.Zapiertrigger.findOne({
            where: {
                userId: user_id,
                name: 'contact',
            },
            attributes: ['hookUrl'],
        })

        console.log('form details are now: ' + JSON.stringify(req.body)); 

        var userId = user_id;
        var status = 0;

        const user = await models.User.findByPk(userId);

        if(!req.body) throw 'error';

        if(req.body.group == -1) {
            console.log('creating new contact and group');
            var group = await user.createGroup(req.body);
        } else {
            var group = await models.Group.findByPk(req.body.group);
        }

        groupId = group.id;

        if(!req.body.contacts) {
            contacts = [{
                phone     : req.body.phone,
                firstname : req.body.firstname,
                lastname  : req.body.lastname,
                email     : req.body.email,
                country   : req.body.country,
            }]
        } else {
            contacts = req.body.contacts;           //  for externalapi API
        }

        let zap_list = [];

        for(let p = 0; p < contacts.length; p++) {
            try {
                let country   = (req.body.countryall) ? req.body.countryall : contacts[p].country;  //  .countryall is for externalapi API
                console.log('COUNTRY = ' + country);
                
                if(!(contacts[p].phone = phoneval(contacts[p].phone, country))) throw { name: "Invalid" };

                let contact = await group.createContact({
                    firstname: contacts[p].firstname,
                    lastname:  contacts[p].lastname,
                    phone:     contacts[p].phone,
                    email:     contacts[p].email,
                    countryId: country,
                    userId:    userId,
                    status:    status,
                })


                console.log('new contact id = ' + contact.id);
                last_contactid = contact.id;
                /* await group.update({
                    count: Sequelize.literal('count + 1'),
                }); */

                if(zap) {
                    let i_d = parseInt(user_id + "" + contact.id + "" + new Date().getTime());
                    zap_list.push({
                        id: i_d,
                        contact_id: contact.id,
                        action_type: "add",
                    })
                }

            } catch(erro) {
                console.error('erro' , erro);
                if(erro.name == 'SequelizeUniqueConstraintError') {
                    if(req.zapier) {    //  IF ZAPIER THEN UPDATE CONTACT
                        req.body.id = null;
                        return await this.saveContact(req, res);
                    }
                    else err.duplicate += 1;
                } else if(erro.name == 'Invalid') {
                    err.invalid += 1;
                } 
                err.total += 1;
                // throw {name: err.name + '-contact'};
                // throw 'error';
            };
        }

        if(zap) {
            let ret = await axios({
                method: 'POST',
                url: zap.hookUrl,
                data: zap_list,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }
        console.log('COUNTS = ' + contacts.length + '; ' + JSON.stringify(err));
        
        if(contacts.length > err.total) {
            fl.mtype = 'SUCCESS';
            fl.msg = 'Your ' + (contacts.length - err.total) + ' new Contact(s) has been created.';
        }
        if(err.duplicate > 0) {
            fl.mtype = fl.mtype || 'ERROR';
            fl.msg = fl.msg + err.duplicate + ' Duplicate Phone Number(s). ';
            fl.code = fl.code || "E033";
        }
        if(err.invalid > 0){
            fl.mtype = fl.mtype || 'ERROR';
            fl.msg = fl.msg + err.invalid + ' Invalid Phone Number(s). ';
            fl.code = fl.code || "E032";
        }

    } catch(err) {
        console.error('errorerr = ' + err);
        
        fl.mtype = fl.mtype || 'ERROR';
        fl.code = "OK";
        if(err.name == 'SequelizeUniqueConstraintError') {
            fl.msg = fl.msg + 'Group Name already exists on your account. ';
            fl.code = "E020";
    } 
        if(fl.msg == '') {
            fl.msg = fl.msg + 'An error occured. Kindly try again later or contact Admin. ';
            fl.code = "EOO1";
        }
    };

    if(req.externalapi) {
        if(req.zapier) {
            let i_d = groupId + "" + new Date().getTime();
            res.send([{
                status: "OK",
                id: i_d,
                group_id: groupId,
                contact_id: last_contactid,
            }])
        } else {
            res.send({
                response: fl.mtype == "SUCCESS" ? {id: groupId, success: contacts.length - err.total, duplicate: err.duplicate, invalid: err.invalid } : "An error occurred.", 
                responseType: fl.mtype, 
                responseCode: fl.code, 
                responseText: fl.mtype == "SUCCESS" ? "Group created successfully." : fl.msg, 
            })
        }
    } else {
        console.log('REQ FLASH = ' + JSON.stringify(fl.mtype.toLowerCase()) + JSON.stringify(fl.msg));
        
        req.flash(fl.mtype.toLowerCase(), fl.msg); 
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    }
}

//  from apiController
exports.saveContact = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "Authentication Error!!!";

        //  CHECK IF USER HAS ZAPIER TRIGGER INTEGRATED
        let zap = await models.Zapiertrigger.findOne({
            where: {
                userId: user_id,
                name: 'contact',
            },
            attributes: ['hookUrl'],
        })
        
        let id_, i_d;
        if(!req.body.id && req.zapier) {  //  IF THROUGH ZAPIER
            id_ = await models.Contact.findOne({
                where: {
                    phone:     req.body.phone,
                    countryId: req.body.country,
                    userId:    user_id,
                },
                attributes: ['id'],
            })
        } else id_ = req.body.id;

        let con = await models.Contact.findByPk(id_)
        if(con.userId == user_id) {
            await con.update({
                ...(req.body.firstname ? {
                    firstname: req.body.firstname,
                } : {}),
                ...(req.body.lastname ? {
                    lastname: req.body.lastname,
                } : {}),
                ...(req.body.email ? {
                    email: req.body.email,
                } : {}),
            })

            //  ZAPIER
            if(zap) {
                let i_d = parseInt(user_id + "" + id_ + "" + new Date().getTime());
                let ret = await axios({
                    method: 'POST',
                    url: zap.hookUrl,
                    data: [{
                        id: i_d,
                        contact_id: id_,
                        action_type: "modify",
                    }],
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
            }
    
            res.send({
                response: "success",
            });
        } else {
            throw "Error: Invalid permission";
        }
    } catch(err) {
        console.log('ERROR: ' + JSON.stringify(err));
        
        res.send({
            response: "Error: Please try again later",
        });
    }

}

//  from apiController
exports.delContact = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "Authentication Error!!!";

        //  CHECK IF USER HAS ZAPPIER TRIGGER INTEGRATED
        let zap = await models.Zapiertrigger.findOne({
            where: {
                userId: user_id,
                name: 'contact',
            },
            attributes: ['hookUrl'],
        })
        
        //  get groups with the contact
        var con = await models.Contact.findByPk(req.query.id)
        if(con.userId == user_id) {
            await con.destroy();
            // var grp = await models.Group.findByPk(con.groupId);
            /* await grp.update({
                count: Sequelize.literal('count - 1'),
            }) */

            //  ZAPIER
            if(zap) {
                let i_d = parseInt(user_id + "" + req.query.id + "" + new Date().getTime());
                let ret = await axios({
                    method: 'POST',
                    url: zap.hookUrl,
                    data: [{
                        id: req.query.id,
                        contact_id: req.query.id,
                        action_type: "delete",
                    }],
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
            }
            
            res.send({
                response: "success",
            });
        } else {
            throw "Error: Invalid permission";
        }
    } catch (err) {
        console.log('ERROR: ' + JSON.stringify(err));
        
        res.send({
            response: "Error: Please try again or contact Admin."
        });
        return;
    }
        

}

//  from apiController
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
                ),
                models.Group.findByPk(req.query.grp, {
                    include: [{
                        model: models.Contact,
                        where: {
                            userId: user_id,
                        },
                        attributes: [[sequelize.fn('count', sequelize.col('groupId')), 'ccount']],
                    }],
                    attributes: ['contacts.groupId'],
                    group: ['contacts.groupId'],
                    // raw: true,
                })
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



