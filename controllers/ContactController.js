const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
const mongoose = require('mongoose');
const { default: axios } = require('axios');

var models = require('../models');
var mongmodels = require('../models/_mongomodels');
var phoneval = require('../my_modules/phonevalidate');
const getCountry = require('../my_modules/getcountry');

// const { Server } = require('mongodb');

// Display list of all contacts
exports.contactList = async (req, res) => {
    var user_id = req.user.id;
    var lnkgrp = req.params.lnkgrp;

    var grps = [];
    var grps_ = await mongmodels.Group.find({
        userId: user_id,
        name: {
            $ne: '[Uncategorized]',
        }
    }, (err, res) => {
        // console.log('EXTRACTED 1: ' + JSON.stringify(res));
        grps.push(...res);
    })
    .sort({
        "createdAt": -1
    })


    var non = await mongmodels.Group.find({
        userId: user_id,
        name: '[Uncategorized]'
    }, (err, res) => {
        // console.log('EXTRACTED 2: ' + JSON.stringify(res));
        grps.push(...res);
    })

    // grps.push(non[0]);

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
        mongmodels.Group.find({
            userId: user_id,
            name: {
                $ne: '[Uncategorized]',
            }
        }, (err, res) => {
            return res;
        }), 
        mongmodels.Group.find({
            userId: user_id,
            name: '[Uncategorized]'
        }, (err, res) => {
            return res;
        }), 
        models.Country.findAll({ 
            where: {
                status: 1
            },
            order: [ 
                ['name', 'ASC']
            ]
        })
    ])
    .then(([grps, non, ctry]) => { 
        var ngrp = non[0]._id;
        
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
    var gname = req.params.gname;

    console.log('form details are now: ' + JSON.stringify(req.body)); 
    console.log('userid: ' + JSON.stringify(user_id) + '; gid: ' + JSON.stringify(gid) + '; gname: ' + gname); 

    let q = await mongmodels.Contact.find({
        userId:  user_id,
        groupId: mongoose.Types.ObjectId(gid), 
    }).select([
        'firstname', 
        'lastname',
        'phone',
        'email',
        'do_sms',
        'do_whatsapp',
        'status',
        'country.name', 
        '_id'
    ]);
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
     let newfile = 'tmp/downloads/' + gname + '_' + timestamp + '.xlsx';

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
            console.log('creating new contact and group' + JSON.stringify(req.body));
            // var group = await user.createGroup(req.body);

            var group = await mongmodels.Group.create({
                // id: 123,
                name: req.body.name,
                userId,
                description: req.body.description,
                count: 0,
            }/* , (err, res) => {
                console.log('________created group ERROR: ' + JSON.stringify(err));
                console.log('________created group details: ' + JSON.stringify(res));
            } */);
        } else {
            // var group = await models.Group.findByPk(req.body.group);
            var group = await mongmodels.Group.findOne({
                ...( req.body.group ? {
                    _id: mongoose.Types.ObjectId(req.body.group),
                    userId
                } : {
                    name: req.body.groupname,
                    userId
                } )
            }, (err, res) => {
                console.log('mongodb found group details: ' + JSON.stringify(res));
                return res;
            });
        }

        groupId = group._id;

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
                console.log('________creating contacts');
                let country   = (req.body.countryall) ? req.body.countryall : contacts[p].country;  //  .countryall is for externalapi API
                console.log('COUNTRY = ' + country);
                
                if(!(contacts[p].phone = phoneval(contacts[p].phone, country))) throw { name: "Invalid" };

                // console.log(JSON.stringify(ctry_));

                var contact = await mongmodels.Contact.create({
                    firstname: contacts[p].firstname,
                    lastname:  contacts[p].lastname,
                    phone:     contacts[p].phone,
                    email:     contacts[p].email,
                    groupId:   mongoose.Types.ObjectId(group._id),
                    country:   await getCountry(country),
                    userId:    userId,
                    status:    status,
                }/* , (err, res) => {
                    console.log('_______created contact with details: ' + JSON.stringify(res));
                    console.log('_______created contact with ERROR: ' + JSON.stringify(err));
                } */);

                console.log('new contact id = ' + contact._id);
                last_contactid = contact._id;
                /* await group.update({
                    count: Sequelize.literal('count + 1'),
                }); */

                if(zap) {
                    let i_d = parseInt(user_id + "" + contact._id + "" + new Date().getTime());
                    zap_list.push({
                        action: "add",
                        contact_id: contact._id,
                        group_id: group._id,
                    })
                }

            } catch(erro) {
                console.error('erro' , erro);
                if((erro.name == 'SequelizeUniqueConstraintError') || (erro.codeName == 'DuplicateKey') || (erro.code == 11000)) {
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
            console.log('...............about checking sending "new contact zap trigger. zap_list: ' + JSON.stringify(zap_list) + '; to url: ' + zap.hookUrl);

            console.log('...............about sending "new contact zap trigger.');
            let ret = await axios({
                method: 'POST',
                url: zap.hookUrl,
                data: JSON.stringify(zap_list),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            console.log('...............just sent "new contact zap trigger.');
            let seen = [];   //  JSON circular reference workaround
            console.log('...............just sent "new contact zap trigger. response: ' + JSON.stringify(ret, function (key, val) {
                if (val != null && typeof val == "object") {
                    if (seen.indexOf(val) >= 0) {
                        return;
                    }
                    seen.push(val);
                }
                return val;
            }) )
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
        if((err.name == 'SequelizeUniqueConstraintError') || (err.codeName == 'DuplicateKey')) {
            fl.msg = fl.msg + 'Group Name already exists on your account. ';
            fl.code = "E020";
        } 
        if((err.MongoError && err.MongoError.search('11000') >= 0)) {
            if(err.MongoError.search('name_1_userId_1') >= 0)) {
                fl.msg = fl.msg + 'Group Name already exists on your account. ';
                fl.code = "E020";
            } else {
                fl.msg = fl.msg + 'Contact(s) already exists in Group. ';
                fl.code = "E019";                
            }
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
            /* id_ = await models.Contact.findOne({
                where: {
                    phone:     req.body.phone,
                    countryId: req.body.country,
                    userId:    user_id,
                },
                attributes: ['id'],
            }); */
            console.log('-----------------0000000000');
            id_ = await mongmodels.Contact.findOne({    
                phone:     req.body.phone,
                'country.id': req.body.country,
                userId:    user_id,
            }, "firstname lastname phone");
        } else id_ = req.body.id;
            console.log('-----------------1111111111');

        /* let con = await models.Contact.findByPk(id_)
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
                        action: "modify",
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
        } */

        let con = await mongmodels.Contact.findOneAndUpdate(
            { 
                _id: mongoose.Types.ObjectId(id_),
                userId: user_id,        //  for authentication
            },
            {
                ...(req.body.firstname ? {
                    firstname: req.body.firstname,
                } : {}),
                ...(req.body.lastname ? {
                    lastname: req.body.lastname,
                } : {}),
                ...(req.body.email ? {
                    email: req.body.email,
                } : {}),
            }
        )

        //  ZAPIER
        if(zap) {
            let i_d = parseInt(user_id + "" + id_ + "" + new Date().getTime());
            let ret = await axios({
                method: 'POST',
                url: zap.hookUrl,
                data: [{
                    action: "modify",
                    contact_id: id_,
                    group_id: con.groupId,
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
        
        //  check for error and throw perhaps invalid permission
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
        await mongmodels.Contact.findOneAndDelete({
            _id: mongoose.Types.ObjectId(req.query.id),
            userId: user_id
        });

        //  ZAPIER
        if(zap) {
            let i_d = parseInt(user_id + "" + req.query.id + "" + new Date().getTime());
            let ret = await axios({
                method: 'POST',
                url: zap.hookUrl,
                data: [{
                    action: "delete",
                    contact_id: req.query.id,
                    group_id: req.query.id,
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
        /* } else {
            throw "Error: Invalid permission";
        } */
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

    var q, q_;
        
    if(req.query.txt) {
        console.log('yes ttt');
        
        let tt = new RegExp(req.query.txt, 'gi');

        q_ = await mongmodels.Contact.find({
            $or: [
                { firstname: tt },
                { lastname: tt },
                { phone: tt },
                { email: tt },
            ],
            userId: user_id,
            ...(
                (req.query.grp != -1) ? {
                    groupId: mongoose.Types.ObjectId(req.query.grp),
                } : {}
            )
        }).select(['_id', 'firstname', 'lastname', 'phone', 'email', 'status']).limit(100);
    } else {
        console.log('no tt');
        if(req.query.grp != -1) {
            // const ObjectId = mongoose.Types.ObjectId;
            q = await Promise.all([
                mongmodels.Group.aggregate([
                    {
                        $match: {
                            _id:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $lookup: {
                            from: "contacts",
                            // localField: '_id', 
                            // foreignField: 'groupId',
                            as: 'contacts',
                            let: {
                                "group_id": "$_id"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        userId:  user_id, 
                                        $expr: {
                                            $eq: [
                                                "$groupId", "$$group_id"
                                            ],
                                        }
                                    }
                                },
                                {
                                    $limit: 100
                                },
                            ]
                        },
                    },
                    // {   $unwind:"$group" },
                    {
                        $project: {
                            "name": 1,
                            "description": 1,
                            "createdAt": 1,
                            "updatedAt": 1,
                            "contacts._id": 1,
                            "contacts.firstname": 1,
                            "contacts.lastname": 1,
                            "contacts.phone": 1,
                            "contacts.email": 1,
                            "contacts.status": 1,
                            "contacts.groupId": 1,
                            // "_id": 0
                        }
                    },
                ], (err, resl) => {
                    console.log('_____________2dowloading data : ' + JSON.stringify(resl));
                    return resl;
                }),
                
/*                 mongmodels.Contact.aggregate([
                    {
                        $match: {
                            status:  0, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "unverified",
                    },
                    // {   $unwind:"$group" },
                    {
                        $unionWith: {
                            coll: 'groups',
                            $pipeline: [
                                {
                                    $match: {
                                        status:  1, 
                                        groupId:  mongoose.Types.ObjectId(req.query.grp), 
                                        userId:  user_id, 
                                    }
                                },
                                { 
                                    $count: "ndnd",
                                },
                            ]
                        }
                    },
                    {
                        $unionWith: {
                            coll: 'groups',
                            $pipeline: [
                                {
                                    $match: {
                                        status:  2, 
                                        groupId:  mongoose.Types.ObjectId(req.query.grp), 
                                        userId:  user_id, 
                                    }
                                },
                                { 
                                    $count: "dnd",
                                },
                            ]
                        }
                    },
                    {
                        $unionWith: {
                            coll: 'groups',
                            $pipeline: [
                                {
                                    $match: {
                                        do_sms: 0, 
                                        groupId:  mongoose.Types.ObjectId(req.query.grp), 
                                        userId:  user_id, 
                                    }
                                },
                                { 
                                    $count: "awoptin",
                                },
                            ]
                        }
                    },
                    {
                        $unionWith: {
                            coll: 'groups',
                            $pipeline: [
                                {
                                    $match: {
                                        do_sms: 1, 
                                        groupId:  mongoose.Types.ObjectId(req.query.grp), 
                                        userId:  user_id, 
                                    }
                                },
                                { 
                                    $count: "optin",
                                },
                            ]
                        }
                    },
                    {
                        $unionWith: {
                            coll: 'groups',
                            $pipeline: [
                                {
                                    $match: {
                                        do_sms:  2, 
                                        groupId:  mongoose.Types.ObjectId(req.query.grp), 
                                        userId:  user_id, 
                                    }
                                },
                                { 
                                    $count: "optout",
                                },
                            ]
                        }
                    },
                ], (err, res) => {
                    console.log('___________found contacts count is : ' + JSON.stringify(res));
                    return res;
                }),
*/
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            status:  0, 
                            groupId: mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "unverified",
                    },
                ], (err, res) => {
                    return res;
                }),
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            status:  1, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "ndnd",
                    },
                ], (err, res) => {
                    return res;
                }),
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            status:  2, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "dnd",
                    },
                ], (err, res) => {
                    return res;
                }),
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            do_sms: 0, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "awoptin",
                    },
                ], (err, res) => {
                    return res;
                }),
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            do_sms: 1, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "optin",
                    },
                ], (err, res) => {
                    return res;
                }),
                mongmodels.Contact.aggregate([
                    {
                        $match: {
                            do_sms:  2, 
                            groupId:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    { 
                        $count: "optout",
                    },
                ], (err, res) => {
                    return res;
                }),

                mongmodels.Group.aggregate([
                    {
                        $match: {
                            _id:  mongoose.Types.ObjectId(req.query.grp), 
                            userId:  user_id, 
                        }
                    },
                    {
                        $lookup: {
                            from: "contacts",
                            // localField: '_id', 
                            // foreignField: 'groupId',
                            as: 'contacts',
                            let: {
                                "group_id": "$_id"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        userId:  user_id, 
                                        $expr: {
                                            $eq: [
                                                "$groupId", "$$group_id"
                                            ]
                                        }
                                    },
                                },
                                {
                                    $count: 'ccount',
                                },
                                // {   $unwind:"$contacts" },
                            ]
                        }
                    },
                    {
                        $project: {
                            "contacts.ccount": 1,
                            "_id": 0,
                        }
                    },
                    // group: ['contacts.groupId'],
                    // raw: true,
                ]),

                /* mongmodels.Group.aggregate([
                    {
                        $lookup: {
                            from: "contacts",
                            localField: '_id', 
                            foreignField: 'groupId',
                            as: 'contacts',
                        },
                        $pipeline: [
                            {
                                $match: {
                                    userId: user_id,
                                }
                            },
                            {
                                $count: 
                            }
                        ]
                    }
                ]) */

            ]);

            let conts = q[0][0]
            let summs = [{
                unverified: q[1][0] ? q[1][0].unverified : null,
                ndnd:       q[2][0] ? q[2][0].ndnd : null,
                dnd:        q[3][0] ? q[3][0].dnd : null,
                awoptin:    q[4][0] ? q[4][0].awoptin : null,
                optin:      q[5][0] ? q[5][0].optin : null,
                optout:     q[6][0] ? q[6][0].optout : null,
            }]
            let ccount = q[7][0];
            q_ = [
                conts,
                summs,
                ccount,
            ]
        } else {
            console.log('no tt');
        
            q_ = await mongmodels.Contact.find({
                    userId: user_id, 
            }).limit(100);
        }
    }

    res.send(q_); 

}



