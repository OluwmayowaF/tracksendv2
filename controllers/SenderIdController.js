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
        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }
        res.render('pages/dashboard/sender_ids', {
            page: 'Sender IDs',
            senderids: true,
            flashtype, flash,

            args: {
                sids: sids,
            }
        });
    });
};

exports.add = (req, res) => {
    var mgauth = require('../config/cfg/mailgun')();
    const mailgun = require('mailgun-js')({apiKey: mgauth.APIKEY, domain: mgauth.DOMAIN});

    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id).then(user => {

        if(req.body.name.length > 0 && req.body.name.length  < 12) {
            user.createSender(req.body) 
            .then((sid) => {
                console.log('ID created');
                
                req.flash('success', 'Your new SenderID has been created. Kindly note that you cannot use this Sender ID in a campaign until it is active. Approval by the telcos takes 6 hours.');

                //  send mail to notify someone
                var data = {
                    from: 'Tracksend <info@tracksend.co>',
                    to: 'Sender ID <sendername@tracksend.co>',
                    subject: 'Tracksend: New SenderID Created.',
                    text: 'A new SenderID called ' + req.body.name + ' has just been created by ' + user.name + ' (' + user.business + ').',
                };
                
                mailgun.messages().send(data, function (error, body) {
                    console.log('mail error: ' + JSON.stringify(error));
                    console.log('mail body: ' + JSON.stringify(body));
                });
        

                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);

            })
            .catch((err) => {
                if(err.name == 'SequelizeUniqueConstraintError') {
                    req.flash('error', 'Sender ID already exists on your account.');
                    var backURL = req.header('Referer') || '/';
                    res.redirect(backURL);
                }
            })
        } else {
            req.flash('error', "Kindly enter a valid Sender ID. Note: max 11 chars; no spaces; only alphanumeric characters.");
            var backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        }

    })


};
