const Sequelize = require('sequelize');

var phoneval = require('../my_modules/phonevalidate');
var models = require('../models');

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

// Display detail page for a specific contact.
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
        console.log('NGRP = ' + JSON.stringify(non[0].id));
        
        var flashtype, flash = req.flash('error');
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
exports.addContact = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var userId = user_id;
    var status = 0;

    models.User.findByPk(userId).then(async user => {
        try {
            // if(req.body.phone.length < 3) throw "Invalid Phone Number";
            if(!(req.body.phone = phoneval(req.body.phone, req.body.country))) throw "Invalid";
            if(req.body.group == -1) {
                console.log('creating new contact and group');
                var group = await user.createGroup(req.body);
            } else {
                var group = await models.Group.findByPk(req.body.group);
            }

            group.createContact({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                phone: req.body.phone,
                email: req.body.email,
                countryId: req.body.country,
                userId: userId,
                status: status,
            })
            .then(() => {
                group.update({
                    count: Sequelize.literal('count + 1'),
                });
            })
            .then(() => {
                req.flash('success', 'Your new Contact has been created.');
                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);
            })
            .catch((err) => {
                console.error(err);
                if(err.name == 'SequelizeUniqueConstraintError') {
                    req.flash('error', 'Contact already exists.');
                } else {
                    req.flash('error', 'An error occurred. Please try again later.');
                }
                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);
            });
            
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
    });

    
}

