const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');
var models = require('../models');
const request = require('request');
const { initializePayment, verifyPayment } = require('../config/paystack')(request);
const randgen = require('../my_modules/randgen');
var env = require('../config/env');

exports.index = async (req, res) => {
    var user_id = req.user.id;
    let tups = await models.Wallet.findAll({ 
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
    });

    const vatRate = await sequelize.query("SELECT vatrate  FROM adminsettings", {
        type: sequelize.QueryTypes.SELECT,
    });

    var flashtype, flash = req.flash('error');
    if(flash.length > 0) {
        flashtype = "error";           
    } else {
        flashtype = "success";
        flash = req.flash('success'); 
    }

    res.render('pages/dashboard/wallet', {
        page: 'Wallet',
        wallet: true,
        settingsmenu: true,
        flashtype, flash,

        args: {
            tups,
            vatRate: Number(vatRate[0].vatrate) * 100,
        }
    });


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

    const vatRate = await sequelize.query("SELECT vatrate  FROM adminsettings", {
        type: sequelize.QueryTypes.SELECT,
    });

    const amount = Number(req.body.amount);
    const vatAmount = Number(vatRate[0].vatrate) * Number(amount);

    var form = _.pick(req.body,['amount','phone','email','full_name','metadata','reference','callback_url']);
    form.full_name = req.user.name;
    form.phone = req.user.phone;
    form.email = req.user.email;
    form.reference = await randgen('paymentref', models.Payment);
    form.callback_url = env.SERVER_BASE + '/dashboard/wallet/ref';
    form.amount = (amount + vatAmount) * 100; //  to kobo

    models.Payment.create({
        paymentref: form.reference,
        userId: req.user.id,
        name: form.full_name,
        phone: form.phone,
        email: form.email,
        amount,
        vat: vatAmount,            
        currency: 'NGN',
        channel: 'CARD',
    })
    .then((pay) => {
        initializePayment(form, (error, body)=>{
            if(error){
                //handle errors
                console.log(JSON.stringify(error));
                req.flash('error', "An error occurred. " + (error.code == "ENOTFOUND" ? "Please check your connection and try again." : "Please refresh page and try again."));
                res.redirect('/dashboard/wallet/');
                return;
            }
            const response = JSON.parse(body);
            console.log('====================================');
            console.log('RESPONSE: ' + JSON.stringify(response));
            console.log('====================================');
            if(!response.status) {
                console.log(error);
                req.flash('error', response.message);
                res.redirect('/dashboard/wallet/');
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
            // const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);
            // var [reference, amount, email, full_name] =  data;
            // var newDonor = {reference, amount, email, full_name}

            const transaction = await sequelize.transaction(async (t) => { 

                let payment = await models.Payment.update({
                    isverified: 1
                }, {
                    where: {
                        paymentref: ref,
                    }
                }, { transaction: t });

                console.log('====================================');
                console.log('payment table update feedbak = ' + JSON.stringify(payment));
                console.log('====================================');

                console.log('response.amount -> ' + response.amount);
                console.log('payment.amount -> ' + payment.amount);
                
                let owo = parseFloat(payment.amount); 

                console.log('we dey here...');
                
                // CREATE WALLET ENTRY
                var tpp = await models.Wallet.create({
                    userId: payment.userId,
                    amount: owo,
                    paymentId: payment.id,
                }, { transaction: t });
                //.then(async () => {
                console.log('and almost finally...');
                
                //  LOG TRANSACTIONS
                await models.Transaction.create({
                    description: 'CREDIT',
                    userId: payment.userId,
                    type: 'TOPUP',
                    ref_id: tpp.id,
                    status: 1,
                    amount: owo, 
                }, { transaction: t });
                
                //  UPDATE USER BALANCE
                var usr = await models.User.update({
                    balance: Sequelize.literal('balance + ' + owo),
                },{
                    where: {
                        id: payment.userId
                    }
                }, { transaction: t });
                console.log('DONE!');
            })

            req.flash('success', 'Payment successful. Wallet topped up with NGN ' + owo + '.');
            res.redirect('/dashboard/wallet/');
            
            return tpp;

        });
    } catch (err) {
        console.error('====================================');
        console.error('ERROR : ' + err);
        console.error('====================================');

        req.flash('error', 'An error occurred during your payment. Kindly contact platform admin.');
        res.redirect('dashboard/wallet/');
    }
};

exports.errpg = (req, res) => {

    
};
