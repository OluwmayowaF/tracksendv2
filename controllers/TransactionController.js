const _ = require('lodash');
const Sequelize = require('sequelize');
var models = require('../models');
const request = require('request');
var env = require('../config/env');

exports.index = async (req, res) => {
    var user_id = req.user.id;
    const allTransactions = await models.Transaction.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ],
        limit: 100
    })
    
            res.render('pages/dashboard/transactions', {
                page: 'Transactions',
                transactions: true,
                settingsmenu: true,
               // flashtype, flash,

                args: {
                    allTransactions,
                  
                }
            });
        console.log(allTransactions, user_id)
    console.log('showing page...'); 
};


exports.download = async (req, res) => {
    console.log('HI')
    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Transaction');
    var style = workbook.createStyle({
        /* font: {
            color: '#FF0800',
            size: 12,
        }, */
        numberFormat: '$#,##0.00; ($#,##0.00); -'
    })
    var user_id = req.user.id;
    var transaction_id = req.params.transid;

    console.log('form details are now: ' + JSON.stringify(req.body)); 
    console.log('userid: ' + JSON.stringify(user_id) + '; transaction_id: ' + JSON.stringify(transaction_id)); 

    const userTransactions = await models.Transaction.findAll({ 
        where: { 
            userId: user_id
        },
        order: [ 
            ['createdAt', 'DESC']
        ],
        limit: 100
    })
    
    worksheet.cell(1,1).string('Amount').style(style);
    worksheet.cell(1,2).string('Transaction type').style(style);
    worksheet.cell(1,3).string('Reference Number').style(style);
    worksheet.cell(1,5).string('Date').style(style);
    worksheet.cell(1,4).string('Status?').style(style);

    var itr = 1;



    userTransactions.forEach(transaction => {
        itr++;
        var stat = parseInt(transaction.status);

         worksheet.cell(itr,1).string(transaction.amount || '--').style(style);
         worksheet.cell(itr,2).string(transaction.description || '--').style(style);
         worksheet.cell(itr,3).string(transaction.trxref).style(style);
         worksheet.cell(itr,5).string(transaction.createdAt || '--').style(style);
         
         switch (stat) {
             case 0:
                transaction.status = "Failed"
                 break;
             case 1:
                transaction.status = "Success"
                 break;
             default:
                 break;
         }
        

         worksheet.cell(itr,6).string(transaction.status).style(style);
         
     });

     let timestamp_ = new Date();
     let timestamp = timestamp_.getTime();
     let newfile = 'tmp/downloads/' + 'transactions' + '_' + timestamp + '.xlsx';

     await workbook.write(newfile, (err, status) => {
         if(err) console.log('_______________ERROR: ' + err);
         else res.download(newfile);
     });
     console.log('____________DONE');


};
