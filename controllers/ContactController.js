const Sequelize = require('sequelize');

var models = require('../models');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts.
exports.contactList = (req, res) => {
    var user_id = req.user.id;


    models.Group.findAll({ 
        where: { 
            userId: user_id
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
                userId: user_id
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
        
        res.render('pages/dashboard/new_contact', {
            page: 'CONTACTS',
            newcontact: true,
            flash: req.flash('success'),

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

    models.User.findByPk(userId).then(user => {

        if(req.body.group == -1) {
            console.log('creating new contact and group');

            /* user.createGroup(req.body)
            .then((group) => {
                group.createContact(req.body)
                .then((contact) => {
                    console.log('the new guy is: ' + contact.id);
                })
            }) */
            /* Promise.all([user.createContact(req.body), user.createGroup(req.body)])
             .then(([contact, group]) => {
                console.log('next create the needful');
                models.ContactGroup.create({
                    contactId: contact.id,
                    groupId: group.id,
                })
                .then(() => {

                    req.flash('success', 'Your new Contact has been created.');
                    var backURL = req.header('Referer') || '/';
                    res.redirect(backURL);

                })
                // group.createContact(req.body)
            }) */
            user.createGroup(req.body)
            .then((group) => {
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
                });
                // group.createContact(req.body)
            });

        } else {

            console.log('just creating new contact');

            models.Group.findByPk(req.body.group)
            .then(group => {
                group.createContact({
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    phone: req.body.phone,
                    email: req.body.email,
                    countryId: req.body.country,
                    userId: userId,
                    status: status,
                })
                .then((contact) => {
                    group.update({
                        count: Sequelize.literal('count + 1'),
                    })
                })
                .then(() => {
                    req.flash('success', 'Your new Contact has been created.');
                    var backURL = req.header('Referer') || '/';
                    res.redirect(backURL);
                })
            })
        }
    })

    
}

