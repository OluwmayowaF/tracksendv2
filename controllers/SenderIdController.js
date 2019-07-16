var models = require('../models');

exports.index = (req, res) => {
    var user_id = req.user.id;

    console.log('showing page...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    models.Sender.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['status', 'DESC'],
            ['createdAt', 'DESC']
        ]
    })
    .then((sids) => {
        console.log('groups are: ' + JSON.stringify(sids));
        res.render('pages/dashboard/sender_ids', {
            page: 'Sender IDs',
            senderids: true,
            flash: req.flash('success'),

            args: {
                sids: sids,
            }
        });
    });
};


exports.add = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id).then(user => {

        user.createSender(req.body) 
        .then((sid) => {
            console.log('ID created');
            
            req.flash('success', 'Your new SenderID has been created. Pending approval...');
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);

        })

    })


};
