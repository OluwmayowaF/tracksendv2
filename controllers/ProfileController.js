const Sequelize = require('sequelize');
var bcrypt = require("bcryptjs");

var models = require('../models');

exports.index = (req, res) => {

    var user_id = req.user.id;

    models.User.findByPk(user_id, 
        {
            raw: true,
            attributes: ['name', 'email', 'phone'], 
        })
    .then(user => { 
        console.log("user: " + JSON.stringify(user));
        
        res.render('pages/dashboard/my_profile', {
            page: 'Profile',
            profile: true,
            flash: req.flash('success'),

            args: {
                user: user,
            }
        });
    });

};

// Display list of all contacts.
exports.update = (req, res) => {
    var user_id = req.user.id;


    models.User.findByPk(user_id)
    .then(user => { 

        user.update(req.body)
        .then(() => {
            req.flash('success', 'Profile update successfully');
            res.redirect('/dashboard/profile');

        })
        
    });

};

// Display detail page for a specific contact.
exports.pwrdupdate = (req, res) => {
    var user_id = req.user.id;

    models.User.findByPk(user_id)
    .then(user => { 

        if(req.body.new_password == req.body.new_password_confirmation) {
            console.log('CONFIRMED1: ' + req.body.new_password);
            console.log('CONFIRMED2: ' + req.body.new_password_confirmation);
            
            var new_password = bcrypt.hashSync(req.body.new_password, bcrypt.genSaltSync(10), null);
            if (user.validPassword(req.body.password)) {
                console.log('VALIDATED');
                user.update({
                    password: new_password
                })
                .then(() => {
                    console.log('UPDATED');
                    req.login(user, function(err) {
                        if (err) { 
                            return next(err); 
                        }
                        req.flash('success', 'Password update successfully');
                        return res.redirect('/dashboard/profile');
                    });
                })

            } else {
                req.flash('error', 'Incorrect password. Kindly relogin.');
                res.redirect('/logout');
            }
            
        } else {
            req.flash('error', 'Password mismatch. Please enter again.');
            res.redirect('/dashboard/profile');
        }
    });

}

