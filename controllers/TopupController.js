const _ = require('lodash');
var models = require('../models');
const request = require('request');
const {initializePayment, verifyPayment} = require('../config/paystack')(request);


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


exports.pay = (req, res) => {

    var form = _.pick(req.body,['amount','email','full_name','metadata','reference']);
    form.full_name = req.user.name;
    form.email = req.user.email;
    form.reference = '';
    form.amount *= 100;
    
    /* form.metadata = {
        full_name : form.full_name
    } */
    initializePayment(form, (error, body)=>{
        if(error){
            //handle errors
            console.log(error);
            return;
       }
       const response = JSON.parse(body);
       res.redirect(response.data.authorization_url)
    });

};

exports.ref = (req, res) => {

    const ref = req.query.reference;
    verifyPayment(ref, (error,body)=>{
        if(error){
            //handle errors appropriately
            console.log(error)
            return res.redirect('/error');
        }
        
        const response = JSON.parse(body);
        const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);
        var [reference, amount, email, full_name] =  data;
        var newDonor = {reference, amount, email, full_name}
        
        const donor = new Donor(newDonor)

        donor.save().then((donor)=>{
            if(!donor){
                res.redirect('/error');
            }
            res.redirect('/receipt/'+donor._id);
        }).catch((e)=>{
            res.redirect('/error');
       });
    });
};
