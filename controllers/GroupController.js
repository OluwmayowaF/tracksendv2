var models = require('../models');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all contacts.
exports.groupList = function(req, res) {
    res.send('NOT IMPLEMENTED: Contact list');
};

// Display detail page for a specific contact.
exports.newGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        console.log('groups are: ' + JSON.stringify(grps));
        
        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            flash: req.flash('success'),

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

    models.User.findByPk(user_id).then(user => {

        user.createGroup(req.body) 
        .then((group) => {
            console.log('group created');

            req.flash('success', 'Your new Group has been created.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);

        })

    })


}
