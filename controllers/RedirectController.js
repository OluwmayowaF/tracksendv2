const Sequelize = require('sequelize');
const moment = require('moment');
var models = require('../models');

exports.index = function(req, res) {

    var surl = req.params.surl;
    var curl = req.params.curl;

    console.log('we show: surl = ' + surl + '; curl = ' + curl);
    
    models.Shortlink.findOne({
        where: { 
            shorturl: surl,
        },
        // attributes: 
    })
    .then((shurl) => {
        //  retrieve msg
        if(shurl == null) {
            console.log('ERROR IN SHURL: ' + JSON.stringify(shurl));
            
            res.render('pages/redirect-error', {
                page: '',
        
            });
            return;
        }
    
        shurl.getMessages({
            where: {
                contactlink: curl,
            }
        })
        .then((msg) => {

            if(msg.length == 0) {
                console.log('ERROR IN MSG' + JSON.stringify(msg));
                
                res.render('pages/redirect-error', {
                    page: '',
            
                });
                return;
            }
            console.log('this is: ' + JSON.stringify(msg));
            
            //  update msg clicks and date (if first time)
            /* if(msg.firstclicktime == null) {
                var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
                msg[0].update({
                    firstclicktime: mysqlTimestamp,
                })
            } */
            var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
            msg[0].update({
                clickcount: Sequelize.literal('clickcount + 1'),
                ...((msg.firstclicktime == null) ? {firstclicktime: mysqlTimestamp} : {})
            })
            .then(() => {
                //  finally, redirect to client URL
                res.redirect(shurl.url);
            })

        })
    })

};

exports.error = function(req, res) {
    console.log('error page');
    
    res.render('pages/redirect-error', {
        page: '',

    });

};

