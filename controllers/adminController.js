const mongoose = require('mongoose');
var models = require('../models');
var mongmodels = require('../models/_mongomodels');
var moment = require('moment');
const sequelize = require('../config/cfg/db');
const Sequelize = require('sequelize');
const mongodb = require('mongoose');
const randgen = require('../my_modules/randgen');
const { default: axios } = require('axios');

exports.index = async(req, res) => {    

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/admin/index', { 
        layout: 'admin',
        page: 'Admin',
        dashboard: true,
        flashtype, flash,

        args: {

        }
    }); 
    
};

exports.perfcontacts = async(req, res) => {    

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/admin/perfcampaigns', { 
        layout: 'admin',
        page: 'Admin',
        dashboard: true,
        flashtype, flash,

        args: {

        }
    }); 
    
};

exports.perfcampaigns = async(req, res) => {    
    var user_id = req.user.id;

    Promise.all([
        mongmodels.PerfCampaign.find({     //  get all pending perf campaigns
            userId: user_id,
            $and: [
               { "status.stage": { $ne: "running" } },
               { "status.stage": { $ne: "expired" } }
            ]
        })
        .sort({
            "createdAt": -1
        }),
        mongmodels.PerfContact.find({}),      //  get all perf contacts
    ]).then(async ([pcpns, pconts ]) => {


        console.log('pcpns = ' + JSON.stringify(pcpns));
        //  return to this when automating calculations for contacts requirement
        /* pcpns.forEach(pc => {
            let cond = pc.conditionset;
            let _or = []
            if(cond.age) {
                let _and = [];
                cond.age.forEach(age => {
                    let from, to;
                    if(age == "Above 65") {
                        from = 65; to = 0;
                    } else {
                        from = age.split(' - ')[0];
                        to = age.split(' - ')[1];
                    }

                    _and.push({ $ge: from }, { $le: to });
                })
            }
        })
        */

        //  return to this when automating calculations for contacts requirement
        /* mongmodels.PerfContact.find({
            ...(
                (cc.age) ? {
                    "fields.age": {
                        $or: [
                            { $and: [{ $ge: 18 }, { $le: 24 }] },
                            { $and: [{ $ge: 34 }, { $le: 44 }] },
                        ]
                    },
                } : {}
            ),
            "fields.age": {
                $or: [
                    { $and: [{ $ge: 18 }, { $le: 24 }] },
                    { $and: [{ $ge: 34 }, { $le: 44 }] },
                ]
            },
            "fields.gdr": {
                $or: [
                    { $and: [{ $ge: 18 }, { $le: 24 }] },
                    { $and: [{ $ge: 34 }, { $le: 44 }] },
                ]
            }
        }) */


        // res.render('pages/dashboard/whatsappcompleteoptin', { 
        res.render('pages/admin/perfcampaigns', { 
            layout: 'admin',
            page: 'Performance Campaigns',
            campaigns: true,
            pcampaigns: true,
            campaign_type: '',
            // has_whatsapp: status.active,
            // flashtype, flash,

            args: {
                pcpns,
                pconts,
            }
        });
    });
    
};

exports.updatePerfCampaign = async(req, res) => {    
    var user_id = req.user.id;
    let id_ = req.body.id

    let upd = await mongmodels.PerfCampaign.findOneAndUpdate(
        { 
            _id: mongoose.Types.ObjectId(id_),
        },
        {
            "status.stage": req.body.status,
            admincomment:   req.body.admincomment,
        }
    )
    console.log('update state = ' + JSON.stringify(upd));
    if(upd) {
        res.send({
            response: "success",
        });
    } else {
        res.send({
            response: "error",
        });
    }
};

exports.manualget = (req, res) => {
    var user_id = req.user.id;

    models.Topup.findAll({ 
        include: [{
            model: models.Payment, 
            // attributes: ['id', 'name', 'nameKh'], 
            where: { 
                channel: "manual"
            }
        },
        {
            model: models.User, 
            attributes: ['id', 'name'], 
        }],
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((tups) => {

        models.Settingstopuprate.findAll({
            order: [ 
                ['id', 'ASC']
            ]
        })
        .then((rates) => {

            console.log('====================================');
            console.log(JSON.stringify(tups));
            console.log('====================================');
            
            var flashtype, flash = req.flash('error');
            if(flash.length > 0) {
                flashtype = "error";           
            } else {
                flashtype = "success";
                flash = req.flash('success'); 
            }

            res.render('pages/admin/manual_topup', {
                layout: 'admin',
                page: 'TopUps', 
                topups: true,
                flashtype, flash,

                args: {
                    tups,
                    rates,
                }
            });
        })

        

    })

};

exports.manualpost = async (req, res) => {

    let uid = req.user.id;
    let cid = req.body.clientid;
    let amt = req.body.amount;
    // let rid = req.body.rateid;
    try {
        let client = await models.User.findByPk(cid);

        let payt = await models.Payment.create({
            paymentref: "Manual_By_" + uid,
            userId: client.id,
            name: client.name,
            phone: client.phone,
            email: client.email,
            amount: amt,
            channel: 'manual',
            isverified: 1,
        })

        let getUnits = async(amt) => {
            var rate = await models.Settingstopuprate.findAll({
                order: [ 
                    ['id', 'ASC']
                ]
            });
            console.log('111111111 -> ' + amt);
            
            let owo = parseInt(amt);
            var units = 0;
            let rid = 0;
            var drate = 0;
            rate.forEach(el => {
                console.log('trying...');
                
                if(owo >= el.lowerlimit && owo <= el.upperlimit) {
                    console.log('got it!');
                    
                    drate = el.amount;
                    rid = el.id;
                }
            });
            if(drate != 0) {
                console.log('moving on...');
                
                units = Math.floor(owo/drate);
            } 

            return {
                units,
                rid,
            }

        }
        
        let gettr = await getUnits(amt);
        console.log('====================================');
        console.log(gettr);
        console.log('====================================');
        let units = gettr.units;
        let rateid = gettr.rid;
        
        if(rateid === 0) {
            console.log('====================================');
            console.log('error in amount');
            console.log('====================================');
        }

        let topup = await models.Topup.create({
            userId: client.id,
            settingstopuprateId: rateid,
            amount: amt,
            units,
            paymentId: payt.id,
        })

        let trx = await models.Transaction.create({
            description: 'CREDIT',
            amount: amt,
            trxref: "Manual_By_" + uid,
            units,
            userId: client.id,
            status: 1, 
            type: 'MANUAL_TOPUP',
            ref_id: topup.id,
        })

        await client.update({
            balance: Sequelize.literal('balance + ' + units),
        });

        req.flash('success', "Manual TopUp Successful");
        res.redirect('/dashboard/m_a_n_u_a_l');
        

    } catch(err) {
        console.error(err);
        console.error('errorerr = ' + err);
        
        if(err.name == 'SequelizeUniqueConstraintError') {
            req.flash('error', 'Group Name already exists on your account.');
        } else if (err == "Invalid" ) {
            req.flash('error', "Invalid Phone Number");
        } else if (err == "Duplicate" ) {
            req.flash('error', "Duplicate Phone Number");
        }
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    };


    console.log('showing page...'); 
    
};

exports.testerly = async (req, res) => {

    return;
    
    //  UPDATE messages DATA WITH NEW CONTACTS _ID
    console.log('====== UPDATE messages DATA WITH NEW CONTACTS _ID ======');
    //  first, grab all contacts from mongodb
    console.log('retrieving contacts from mongodb...');
    let mc = await mongmodels.Contact.find({id: {$gt: 0}}, "_id id");
    console.log('retrieving contacts done.');
    //  then, iterate through and updatein messages table
    console.log('iterating through and updating messages, optouts, and customcontactresponses tables...');
    for(let i = 0; i < mc.length; i++) {
        await sequelize.query("UPDATE messages SET contactId = :_id WHERE contactId = :id", {
                replacements: {id: mc[i].id.toString(), _id: mc[i]._id.toString()},
            }
        );

        await sequelize.query("UPDATE optouts SET contactId = :_id WHERE contactId = :id", {
            replacements: {id: mc[i].id.toString(), _id: mc[i]._id.toString()},
        });

        await sequelize.query("UPDATE customcontactresponses SET contactId = :_id WHERE contactId = :id", {
            replacements: {id: mc[i].id.toString(), _id: mc[i]._id.toString()},
        });
        /* models.Campaign.findAll({ 


        await models.Message.update({
            contactId: mc[i]._id.toString()
        }, {
            where: {
                contactId: mc[i].id
            }
        }) */
    }
    console.log('iterating through and updating tables done.');
    console.log('..........A L L   D O N E........');

    
    /* //  UPDATE optouts DATA WITH NEW CONTACTS _ID
    console.log('====== UPDATE optouts DATA WITH NEW CONTACTS _ID ======');
    //  then, iterate through contacts and updatein optouts table
    console.log('iterating through and updating optouts table...');
    for(let i = 0; i < mc.length; i++) {


        await models.Optout.update({
            contactId: mc[i]._id
        }, {
            where: {
                contactId: mc[i].id
            }
        })
    }
    console.log('iterating through and updating optouts table done.');

    //  UPDATE customcontactresponses DATA WITH NEW CONTACTS _ID
    console.log('====== UPDATE optouts DATA WITH NEW CONTACTS _ID ======');
    //  then, iterate through contacts and updatein customcontactresponses table
    console.log('iterating through and updating customcontactresponses table...');
    for(let i = 0; i < mc.length; i++) {
        await models.Optout.update({
            contactId: mc[i]._id
        }, {
            where: {
                contactId: mc[i].id
            }
        })
    }
    console.log('iterating through and updating customcontactresponses table done.');
    console.log('.......ALL DONE.........'); */
    return;

    //  refactor groups into  mongodb
    const groups = await models.Group.findAll();
    await mongmodels.Group.deleteMany({});
    var grplist = [];
    await mongmodels.Group.insertMany(JSON.parse(JSON.stringify(groups))) //   for massive amount of bulk insert
    // mongmodels.Group.insertMany(JSON.parse(JSON.stringify(groups)))
    .then(() => {
        console.log('Migration ' + groups.length + ' Groups...DONE');

        mongmodels.Group.aggregate([
            {
                $project: {
                    _id: 1,
                    id: 1
                }
            }
        ], (err, res) => {
            grplist = res;
        })
    })
    .catch((err) => {
        console.log('Groups migration ERROR' + err);
    })
    
    //  refactor contacts into mongodb
    const contacts = await models.Contact.findAll({
        /* where: {
            groupId: 1
        }, */
        include: [{
            model: models.Country, 
            attributes: ['id','name','abbreviation'], 
        }]
    });
    
    console.log('FOUND ' + contacts.length + ' contacts.');
    console.log('PROCESSING...');

    for(let c = 0; c < contacts.length; c++) {
        for(let g = 0; g < grplist.length; g++) {
            if(contacts[c].groupId == grplist[g].id) {
                // if(c < 10) console.log('found');
                contacts[c].groupId = grplist[g]._id;
            }
        }
        // if(c < 10) console.log('_______ ' + JSON.stringify(contacts[c]));
    }
    console.log('LOADING...');
        // console.log('Migrating ' + JSON.stringify(contacts));
    await mongmodels.Contact.deleteMany({});
    mongmodels.Contact.insertMany(JSON.parse(JSON.stringify(contacts))) //   for massive amount of bulk insert
    // mongmodels.Contact.insertMany(JSON.parse(JSON.stringify(contacts)))
    .then(() => {
        console.log('Migration of' + contacts.length + ' Contacts...DONE');
    })
    .catch((err) => {
        console.log('Contacts migration ERROR' + err);
    })
    
};

