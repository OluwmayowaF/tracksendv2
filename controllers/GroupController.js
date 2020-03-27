const Sequelize = require('sequelize');
var models = require('../models');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};


// Display detail page for a specific contact. 
exports.listGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        // console.log('groups are: ' + JSON.stringify(grps) + '; flash: ' + req.flash('error'));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: '',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.listSMSGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: 1
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        // console.log('groups are: ' + JSON.stringify(grps) + '; flash: ' + req.flash('error'));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: 'SMS',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.listWAGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: 2
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        // console.log('groups are: ' + JSON.stringify(grps) + '; flash: ' + req.flash('error'));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: 'WhatsApp',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.addGroup = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id)
    .then(user => {
        if(req.body.name.length > 0) {
            user.createGroup({
                name: req.body.name,
                description: req.body.description,
                can_optin: req.body.can_optin && (req.body.can_optin == 'on') ? true : false,
            }) 
            .then((group) => {
                console.log('group created');

                req.flash('success', 'Your new Group has been created.');
                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);

            })
            .catch((err) => {
                if(err.name == 'SequelizeUniqueConstraintError') {
                    req.flash('error', 'Group Name already exists on your account.');
                    var backURL = req.header('Referer') || '/';
                    res.redirect(backURL);
                }
            })
        } else {
            req.flash('error', 'Kindly enter a valid group name');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        }
    })


}
