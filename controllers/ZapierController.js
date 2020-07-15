const _ = require('lodash');
const Sequelize = require('sequelize');
var models = require('../models');
const request = require('request');
const { initializePayment, verifyPayment } = require('../config/paystack')(request);
const randgen = require('../my_modules/randgen');
var env = require('../config/env');

exports.add = async (req, res) => {
    
    


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

exports.delete = async (req, res) => {

    var form = _.pick(req.body,['amount','phone','email','full_name','metadata','reference','callback_url']);
    form.full_name = req.user.name;
    form.phone = req.user.phone;
    form.email = req.user.email;
    form.reference = await randgen('paymentref', models.Payment);
    form.callback_url = env.SERVER_BASE + '/dashboard/topups/ref';
    form.amount *= 100;
    
    models.Payment.create({
        paymentref: form.reference,
        userId: req.user.id,
        name: form.full_name,
        phone: form.phone,
        email: form.email,
        amount: form.amount,       //   amount in kobo
        currency: 'NGN',
        channel: '-',
    })
    .then((pay) => {
        initializePayment(form, (error, body)=>{
            if(error){
                //handle errors
                console.log(error);
                req.flash('error', 'An error occurred. Please refresh page and try again.');
                res.redirect('/dashboard/topups/');
                return;
            }
            const response = JSON.parse(body);
            console.log('====================================');
            console.log('RESPONSE: ' + JSON.stringify(response));
            console.log('====================================');
            if(!response.status) {
                console.log(error);
                req.flash('error', response.message);
                res.redirect('/dashboard/topups/');
                return;                
            }
            res.redirect(response.data.authorization_url)
        });
        
    } )
    /* form.metadata = {
        full_name : form.full_name
    } */

};

exports.testdata = (req, res) => {

    console.log('ZZZZZAAAAAAPPPPPPPIIIIIEEEEEEEEEEERRRRRRRR');
    console.log('AUTH = ' + req.header('X-API-KEY'));

    res.send(200)

};

