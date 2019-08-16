const Sequelize = require('sequelize');

var models = require('../models');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts
exports.contactList = (req, res) => {
    var user_id = req.user.id;


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
    })
    .then(grps => { 
        
        res.render('pages/dashboard/contact_list', {
            page: 'CONTACTS',
            contactlist: true,

            args: {
                grps: grps,
            }
        });
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
        models.Country.findAll({ 
            order: [ 
                ['name', 'ASC']
            ]
        })
    ])
    .then(([grps, ctry]) => { 
        
        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

       res.render('pages/dashboard/new_contact', {
            page: 'CONTACTS',
            newcontact: true,
            flashtype, flash,

            args: {
                grps: grps,
                ctry: ctry,
            }
        });
    });

}

// Handle contact create on POST.
exports.addContact = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now: ' + JSON.stringify(req.body)); 

    var userId = user_id;
    var status = 0;

    models.User.findByPk(userId).then(async user => {
        try {
            if(req.body.phone.length < 3) throw "Invalid Phone Number";
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
        } catch(err) {
            console.log(err);
            console.log('errorerr = ' + err);
            
            if(err.name == 'SequelizeUniqueConstraintError') {
                req.flash('error', 'Group Name already exists on your account.');
            } else if (err == "Invalid Phone Number" ) {
                req.flash('error', err);
            }
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        };
    });

    
}

