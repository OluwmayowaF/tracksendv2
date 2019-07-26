var models = require('../models');

exports.index = (req, res) => {
    var user_id = req.user.id;

    models.Topup.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((tups) => {

        res.render('pages/dashboard/topups', {
            page: 'TopUps',
            topups: true,
            // flash: req.flash('success'),

            args: {
                tups: tups,
            }
        });

    })


    console.log('showing page...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    /* models.Sender.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((sids) => {
        console.log('groups are: ' + JSON.stringify(sids));
    }); */
};


exports.add = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id).then(user => {

        user.createSender(req.body) 
        .then((sid) => {
            console.log('ID created');
            
            req.flash('success', 'Your new SenderID has been created.');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);

        })

    })


};
