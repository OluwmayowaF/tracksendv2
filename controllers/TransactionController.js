const _ = require('lodash');
const Sequelize = require('sequelize');
var models = require('../models');
const request = require('request');
var env = require('../config/env');

exports.index = async (req, res) => {
    var user_id = req.user.id;
    const allTransactions = await models.Transaction.findAll({ 
        where: { 
            userId: 59
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


/*exports.download = async (req, res) => {
    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Transactions');
   
    var headingColumnNames = [
        "Date",
        "Amount",
        "Units",
       "Transaction type",
       "Reference number",
        "Status",
    ];

    //Write Column Title in Excel file 
    var headingColumnIndex = 1;
    headingColumnNames.forEach(heading =>{
        worksheet.cell(1, headingColumnIndex++)
        .string(heading)

    });

    //Write Data in Excel file
    var rowIndex = 2;
    data.forEach( record => {
        var columnIndex = 1;
        Object.keys(record).forEach(columnName => {
            worksheet.cell(rowIndex, columnIndex++)
            .string(record[columnName])
        });
        rowIndex++;
    });

    let timestamp_ = new Date();
     let timestamp = timestamp_.getTime();
     let newfile = 'tmp/downloads/' + gname + '_' + timestamp + '.xlsx';

     await workbook.write(newfile, (err, status) => {
         if(err) console.log('_______________ERROR: ' + err);
         else res.download(newfile);
     });
     console.log('____________DONE');


}*/