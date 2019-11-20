var models = require('../models');
var request = require('request');

exports.index = (req, res) => {
    var user_id = req.user.id;

    console.log('showing page...integrations...'); 
    // var flash = req.flash('success')
    // console.log('flash details are now: ' + flash); 

    // var url = 'https://eu2.chat-api.com/instance76984/sendMessage?token=mgnd0b9bpaehouf2';
    var url = 'https://eu2.chat-api.com/instance76984/status?token=mgnd0b9bpaehouf2';
    request.get(url, (error, res, body) => {
        console.log('====================================');
        console.log(JSON.stringify(error + res + body));
        console.log('====================================');
    });

    return;

    console.log('groups are: ' + JSON.stringify(url));
    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success');
    }

    res.render('pages/dashboard/integrations', {
        page: 'Integrations',
        integrations: true,
        flashtype, flash,

        args: {
            sids: 'sids',
        }
    });
};

exports.update = (req, res) => {
    var user_id = req.user.id;

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    models.User.findByPk(user_id).then(user => {

        if(req.body.name.length > 0 && req.body.name.length  < 12) {
            user.createSender(req.body) 
            .then((sid) => {
                console.log('ID created');
                
                req.flash('success', 'Your new SenderID has been created. Kindly note that you cannot use this Sender ID in a campaign until it is active. Approval by the telcos takes 6 hours.');
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
