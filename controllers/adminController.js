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

    let ups = await mongmodels.PerfContact.aggregate([
        {
            $group: {
                _id: "$batch",
                count: { $sum : 1},
                uploaded: { $first: "$createdAt" },
                lastused: { $last: "$updatedAt" },
            }
        }
    ])

    console.log('istory = ' + JSON.stringify(ups));
    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/admin/upload_contacts', { 
        layout: 'admin',
        page: 'Upload Performance Campaign Contacts',
        dashboard: true,
        flashtype, flash,

        args: {
            ups,
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

exports.countries = async(req, res) => {    
    var user_id = req.user.id;

    const ctrys = await models.Country.findAll({
        order: [ 
            ['name', 'ASC']
        ]
    });

    // console.log('pcpns = ' + JSON.stringify(pcpns));

    res.render('pages/admin/countries', { 
        layout: 'admin',
        page: 'Countries',
        countries: true,
        // flashtype, flash,

        args: {
            ctrys,
        }
    });

};

exports.addCountry = async(req, res) => {    

    const ctry = await models.Country.create({
        id: req.body.id,
        name: req.body.name,
        abbreviation: req.body.abbreviation.toUpperCase(),
        status: (req.body.notavailable && req.body.notavailable == "on") ? 0 : 1,
    })

    // console.log('pcpns = ' + JSON.stringify(pcpns));

    if(ctry) req.flash('success', 'Country added successfully.');
    else  req.flash('error', 'An error occurred.');
    const backURL = req.header('Referer') || '/';
    res.redirect(backURL);

};

exports.updateCountry = async(req, res) => {    
    console.log(JSON.stringify(req.body));
    const upd = await models.Country.update({
        status: (req.body.available && req.body.available == "on") ? 1 : 0,
    }, {
        where: {
            id: req.body.id
        }
    });

    res.send({ response: upd ? "success" : "error" });

};

exports.updatePerfCampaign = async(req, res) => {    
    var user_id = req.user.id;
    let id_ = req.body.id

    var upd = await mongmodels.PerfCampaign.findOneAndUpdate(
        { 
            _id: mongoose.Types.ObjectId(id_),
        },
        {
            ...(req.body.status ? {"status.stage": req.body.status} : {}),
            ...(req.body.admincomment ? {admincomment: req.body.admincomment} : {}),
            ...(req.body.cost ? {cost: req.body.cost} : {}),
        }
    )
    if(upd) {
        console.log('update state = ' + JSON.stringify(upd));

        let usr = await models.User.findByPk(upd.userId, {
            attributes: ['name', 'email']
        });

        var mgauth = require('../config/cfg/mailgun')();
        const mailgun = require('mailgun-js')({apiKey: mgauth.APIKEY, domain: mgauth.DOMAIN});

        var data = {
            from: 'Tracksend <info@tracksend.co>',
            to: usr.email,
            subject: 'Tracksend: Performance Campaign ' + req.body.status,
            text: 'Hello. We will like to inform you that your Performance Campaign with name, ' + upd.name + ' has just been ' + req.body.status + ' by Admin. The cost ' + upd.measure + ' is ' + req.body.cost + '.',
        };
        
        mailgun.messages().send(data, function (error, body) {
            console.log('mail error: ' + JSON.stringify(error));
            console.log('mail body: ' + JSON.stringify(body));
        });

        res.send({
            response: "success",
        });
    } else {
        res.send({
            response: "error",
        });
    }
};

exports.uploadPerfContacts = async (req, res) => {
    const fs        = require('fs');
    const csv    = require('fast-csv');
    var uploadMyFile = require('../my_modules/uploadHandlers');
    var phoneval = require('../my_modules/phonevalidate');
    // return;
    console.log('showing pageR...'); 
    var user_id = req.user.id;

    var fd;
    const fileRows = [];
    var headers = [], rows_formatted, rows_validated;
    var has_headers = true;
    var rowcount = 0;
    var uploadbatchnumber = new Date().getTime();

    var total_errors = 0;
    var phone_errors = 0;
    var email_errors = 0;
    
    if(!req.files || Object.keys(req.files).length === 0) {

    }
    let uploadedfile = await uploadMyFile(req.files.file, 'contacts');
    console.log('file attribs : ' + JSON.stringify(req.files.file));
    // await ofile.mv('tmp/whatsapp/'+tempfilename);  


    console.log('Parsing uploaded file starting...');
    // csv.parseFile(req.files.file.name)
    csv.parseFile(uploadedfile.filepath)
    .on("data", function (data) {

        if(rowcount === 0) {
            headers = data; // push each row
            console.log('Batch header captured...');
        } else {
            fileRows.push(data); // push each row aside the header
        }
        rowcount++;

    })
    .on("end", async function () {

        fs.unlinkSync(uploadedfile.filepath);   // remove temp file
        console.log('File parse complete...');
        
        //  formatted data for db structure
        rows_formatted = fileRows.map(mapfn); 
        console.log('Uploaded data formatting complete...' + JSON.stringify(rows_formatted));

        //  filter out corrupt entries
        rows_validated = rows_formatted.filter(validateCsvRow);
        console.log('Data validation complete...');

        // console.log('________FINAL DATA: ' + JSON.stringify(rows_validated));
        console.log('t_error: ' + total_errors + '; e_errors: ' + email_errors + '; p_errors: ' + phone_errors);
        // return;

        // let finished = await mongmodels.PerfContact.insertMany(JSON.parse(JSON.stringify(rows_validated))) //   for massive amount of bulk insert
        let finished = await mongmodels.PerfContact.insertMany(rows_validated) //   for massive amount of bulk insert

        // console.log('________FINISHED = ' + JSON.stringify(finished));
        let inserted = 0;
        if(finished) {
            inserted = finished.length;
            console.log('DATABASE INSERT COMPLETED!');
            // duplicates = result.warningCount;
        } else {
            console.log('ERROR: IN INSERTING CONTACTS');
        }
        
        // req.flash('success', 'Upload complete successfully: <b>' + inserted + '</b> duplicate contacts added; <b>' + duplicates + '</b> contacts ignored.');
        // if(inserted) req.flash('success', 'Upload completed successfully: ' + inserted + ' contacts added; ' + duplicates + ' duplicate contacts ignored' + (phone_errors > 0 ? '; ' + phone_errors + ' contacts with invalid numbers ignored' : '') );
        if(inserted) req.flash('success', 'Upload completed successfully: ' + inserted + ' contacts added' + ((phone_errors) ? '; ' + phone_errors + ' contacts with invalid numbers ignored' : '.'));
        else req.flash('error', 'Upload failure. Please try again later or contact Admin');
        res.redirect('/admin/perfcontacts');
        
    })
    .on("error", function (error) {
        req.flash('error', 'An error occurred accessing your upload, please re-upload your file.');
        res.redirect('/admin/perfcontacts');
        return;
    })

    //  This function formats the data for mongodb structure
    function mapfn(row) {
        let obj = {
            usecount: 0,
            batch: uploadbatchnumber,
            status: {
                dnd: 'maybe',
                active: true
            }
        };
        obj['fields'] = {};

        row.forEach((val, i) => {
            if(headers[i].search(/phone/gi) !== -1) {
                // console.log('OTHER FOUND @ i = ' + i);
                obj['phone'] = val;
            } else if(headers[i].search(/cost/gi) !== -1) {
                // console.log('OTHER FOUND @ i = ' + i);
                obj['cost'] = val;
            } else if(headers[i].search(/price/gi) !== -1) {
                // console.log('OTHER FOUND @ i = ' + i);
                obj['price'] = val;
            } else {
                // console.log('OTHER NOOOOT FOUND @ i = ' + i);
                obj['fields'][textToSluggish(headers[i])] = (typeof val == "string") ? (textToSluggish(headers[i]) == "location" ? val.split(',').map(v => {return v.trim().toLowerCase()}) : val.toLowerCase()) : val; 
            }

        })

        return obj;
    }

    //  This function validates the fields, especially phone number
    function validateCsvRow(row) {
        var phone = phoneval(row.phone, row.fields.countryid);
        var email = row.fields.email;

        if(phone) {
            // console.log('.................true');
            row.phone = phone;
            return true;
        } else {
            // console.log('.................false');
            total_errors++;
            phone_errors++;
            return false;
        }
        //let r_e = checkEmail(email);
        // return (checkPhone(phone));

        function checkEmail(email) {
            if(email.length > 5) {
                return true;
            }
            total_errors++;
            email_errors++;
            return false;
        }
    }

    //  This function converts texts to slug forms
    function textToSluggish(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '_')
            .replace(/^-+/g, '')
            .replace(/-+$/g, '');
    }

}; 

exports.manualget = (req, res) => {
    var user_id = req.user.id;

    models.Wallet.findAll({ 
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
    let amt = Number(req.body.amount);
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

        /* let getUnits = async(amt) => {
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
        } */

        let topup = await models.Wallet.create({
            userId: client.id,
            amount: amt,
            paymentId: payt.id,
        })

        let trx = await models.Transaction.create({
            description: 'CREDIT',
            amount: amt,
            trxref: "Manual_By_" + uid,
            amount: amt,
            userId: client.id,
            status: 1, 
            type: 'MANUAL_TOPUP',
            ref_id: topup.id,
        })

        await client.update({
            balance: Sequelize.literal('balance + ' + amt),
        });

        req.flash('success', "Manual TopUp Successful");
        res.redirect('/admin/m_a_n_u_a_l');
        

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
    
    let err = false;

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
        err = true;
    })

    if(err) return;
    
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
        err = true;
    })

    if(err) return;
    // return;
    
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

    return;

};

