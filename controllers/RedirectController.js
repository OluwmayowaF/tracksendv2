const Sequelize = require('sequelize');
const moment = require('moment');
var models = require('../models');

exports.sms = async function(req, res) {

    var surl = req.params.surl;
    var curl = req.params.curl;
    var seencmpgn = false;
    var cmpgn;

    console.log('we show: surl = ' + surl + '; curl = ' + curl);
    
    var shurl = await models.Shortlink.findOne({
        where: { 
            shorturl: surl,
        },
        // attributes: 
    });

    if(shurl == null) {
        console.log('ERROR IN SHURL: ' + JSON.stringify(shurl));
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    }

    var pro = await Promise.all([
        shurl.getMessages({
            where: {
                contactlink: curl,
            }
        }),
        shurl.update({
            clickcount: Sequelize.literal('clickcount + 1'),
        })
    ])
    
    if(pro[0].length == 0) {
        console.log('ERROR IN MSG' + JSON.stringify(msg));
        
        res.render('pages/redirect-error', {
            page: '',
    
        });
        return;
    }
    console.log('this is: ' + JSON.stringify(pro));
    
    //  update msg clicks and date (if first time)
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    await pro[0][0].update({
        clickcount: Sequelize.literal('clickcount + 1'),
        ...((pro[0][0].firstclicktime == null) ? {firstclicktime: mysqlTimestamp} : {})
    })

    //  finally, redirect to client URL
    let utm = '';
    console.log('pre-utm-check; cid = ' + pro[0][0].campaignId + ' -- ' + JSON.stringify(pro[0]));
    
    if(shurl.has_utm) {
        console.log('post-utm-check');
        cmpgn = await models.Campaign.findByPk((pro[0][0].campaignId), {
            attributes: ['name'], 
        })
        //   seencmpgn = true;
        utm = '?utm_source=tracksend&utm_medium=tracksend&utm_campaign=' + cmpgn.name;
    }
    res.redirect(shurl.url + utm);

};

exports.browser = function(req, res) {

    var surl = req.params.surl;
    var cmpgn;

    console.log('we show: surl = ' + surl);
    
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
            .then(async () => {
                //  finally, redirect to client URL
                let utm = '';
                if(shurl.has_utm) {
                    cmpgn = await models.Campaign.findByPk((shurl.campaignId), {
                        attributes: ['name'], 
                    })
                 //   seencmpgn = true;
                    utm = '?utm_source=tracksend&utm_medium=tracksend&utm_campaign=' + cmpgn.name;
                }
                res.redirect(shurl.url + utm);
            })

        })
    })

};

exports.error = function(req, res) {
    console.log('error page q');
    
    res.render('pages/redirect-error', {
        page: '',

    });

};

