const _ = require('lodash');
const Sequelize = require('sequelize');
var models = require('../models');
const request = require('request');
const { initializePayment, verifyPayment } = require('../config/paystack')(request);
const randgen = require('../my_modules/randgen');


exports.index = async (req, res) => {
    var user_id = req.user.id;
    models.Topup.findAll({ 
        include: [{
            model: models.Payment, 
            attributes: ['channel'], 
        }],
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then((tups) => {

        models.Settingstopuprate.findAll({
            order: [ 
                ['id', 'ASC']
            ]
        })
        .then((rates) => {

            console.log('====================================');
            console.log(JSON.stringify(rates));
            console.log('====================================');
            
            var flashtype, flash = req.flash('error');
            if(flash.length > 0) {
                flashtype = "error";           
            } else {
                flashtype = "success";
                flash = req.flash('success'); 
            }

            res.render('pages/dashboard/topups', {
                page: 'TopUps',
                topups: true,
                flashtype, flash,

                args: {
                    tups,
                    rates,
                }
            });
        })

        

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


exports.pay = async (req, res) => {

    var form = _.pick(req.body,['amount','phone','email','full_name','metadata','reference','callback_url']);
    form.full_name = req.user.name;
    form.phone = req.user.phone;
    form.email = req.user.email;
    form.reference = await randgen('paymentref', models.Payment);
    form.callback_url = 'https://app.tracksend.co/dashboard/topups/ref';
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

exports.ref = (req, res) => {

    try {
        const ref = req.query.reference;
        verifyPayment(ref, async (error, body)=>{
            if(error){
                //handle errors appropriately
                console.log(error)
                // return res.redirect('dashboard/topups/error');
                throw 'Error in verifying payment.';
            }
            
            const response = JSON.parse(body);
            console.log('RESPONSE IS -> ' + JSON.stringify(response));
            const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);
            var [reference, amount, email, full_name] =  data;
            var newDonor = {reference, amount, email, full_name}

            let payments = await models.Payment.findAll({
                where: {
                    paymentref: ref,
                }
            });

            var payment_ = payments[0];

            console.log('retrieved payment: ' + JSON.stringify(payment_) + 'payent id is = ' + payment_.id);
            var payment = await models.Payment.findByPk(payment_.id);
            var r = await payment.update({isverified: 1,});
                console.log('====================================');
                console.log('payment table update feedbak = ' + JSON.stringify(r));
                console.log('====================================');

            var rate = await models.Settingstopuprate.findAll({
                order: [ 
                    ['id', 'ASC']
                ]
            });
            console.log('111111111 -> ' + response.amount);
            
            let owo = parseInt(r.amount)/100;
            var units = 0;
            var rid = 0;
            var drate = 0;
            rate.forEach(el => {
                console.log('trying...');
                
                if(owo >= el.lowerlimit && owo <= el.upperlimit) {
                    console.log('got it!');
                    
                    drate = el.amount;
                    rid = el.id;
                }
            });
            if(drate != 0) {
                console.log('moving on...');
                
                units = Math.floor(owo/drate);
            } else throw 'Error in amount paid';

            console.log('we dey here...');
            
            var tpp = await models.Topup.create({
                userId: payment.userId,
                settingstopuprateId: rid,
                amount: payment.amount/100, //  amount in NGN
                units,
                paymentId: payment.id,
            })
            //.then(async () => {
            console.log('and almost finally...');
            
            //  LOG TRANSACTIONS
            await models.Transaction.create({
                description: 'CREDIT',
                userId: payment.userId,
                type: 'TOPUP',
                ref_id: tpp.id,
                units: units,
                status: 1,
            })
            
            var usr = await models.User.findByPk(payment.userId);
            await usr.update({
                balance: Sequelize.literal('balance + ' + units),
            });
            console.log('DONE!');
            
            req.flash('success', 'Payment successful. Account topped up with ' + units + ' units.');
            res.redirect('/dashboard/topups/');


            //})
            
            return tpp;
            /* const donor = new Donor(newDonor)

            donor.save().then((donor)=>{
                if(!donor){
                    res.redirect('dashboard/topups/error');
                }
                res.redirect('/receipt/'+donor._id);
            }).catch((e)=>{
        }); */
        });
    } catch (err) {
        console.log('====================================');
        console.log('ERROR : ' + err);
        console.log('====================================');

        req.flash('error', 'An error occurred during your payment. Kindly contact platform admin.');
        res.redirect('dashboard/topups/');
    }
};

exports.errpg = (req, res) => {

    
};
