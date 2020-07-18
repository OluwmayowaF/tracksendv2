const request = require('request');
const { default: axios } = require('axios');
var env = require('../../config/env');

//  KIRUSA INIT
const kirusa = require('../../config/cfg/kirusa');

//  INFOBIP INIT
const { tracksend_user, tracksend_pwrd, tracksend_base_url } = require('../../config/cfg/infobip')();
var buff = Buffer.from(tracksend_user + ':' + tracksend_pwrd);
var base64encode = buff.toString('base64');

//  MESSAGEBIRD INIT
const msgbirdk = require('../../config/cfg/messagebird');
var messagebird = require('messagebird')(msgbirdk.API_KEY_L);
// const messagebirds = messagebird

//  AFRICA'S TALKING INIT
const africastalkingOptions = require('../../config/cfg/africastalking');
var africastalking = require('africastalking')(africastalkingOptions);


const sendSMS =  async (platform, params, url = null, message = null, sender = null, phone = null, tracking = null, bulkid = null, type = null ) => {
    
    if(platform == 'kirusa') {
        if(message) {  //   if not from campaign
            console.log('======= ++++++ =======' + JSON.stringify(platform));
            let data = {
                "id" : new Date().getTime().toString(),
                "sender_mask" : sender,
                "to" : phone,
                "body" : message,
                "callback_url" : env.SERVER_BASE + '/api/sms/kirusa/notify',
            };

            params = {
                url: url || 'https://konnect.kirusa.com/api/v1/Accounts/' + kirusa.accountid + '/Messages',
                json: data,
                headers: {
                    'Authorization': kirusa.apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        }

        console.log('____________________ PARAMS = ' + JSON.stringify(params));
        
        try {
            let tosend_ = {
                method: 'POST',
                url: params.url,
                data: params,
                headers: params.headers
            };

            console.log('PRESEND: ' + JSON.stringify(tosend_));
            
            let ret = await axios(tosend_);

            /* let ret = {
                status: 200
            } */
            /* let ret = await request.post(params, async (err, response) => {
                if(err) {
                    console.log('---' + err);
                    console.log('j---' + JSON.stringify(err));
                    
                    return err
                }
                else {
                    console.log('-+-+-' + response);
                    console.log('j-+-+-' + JSON.stringify(response));
                    return response;
                }
            }); */
            let seen = [];
            console.log('1a~~~d~~~e~~~l~~~e~~~~')
            console.log('1a~~~~~~~~~~~~~~~~' + JSON.stringify(ret, function (key, val) {
                if (val != null && typeof val == "object") {
                    if (seen.indexOf(val) >= 0) {
                        return;
                    }
                    seen.push(val);
                }
                return val;
            }));
            return ret;
        } catch(err) {
            console.log('1b~~~~~~~~~~~~~~~~' + err);
            console.log('j1b~~~~~~~~~~~~~~~~' + JSON.stringify(err));
            return err;
        }
        /* .then(res => {
            console.log('respons = ' + JSON.stringify(res.data.code));
        }) */
        
        
        /* let ret = await request.post(body, async (err, response) => {
            if(err) {
                console.log('---' + JSON.stringify(err));
                
                return err
            }
            else {
                console.log('-+-+-' + JSON.stringify(response));
                return response;
            }
        }); */
        
    }

    if(platform == 'infobip') {
        if(message) {
            console.log('======= ++++++ =======' + JSON.stringify(platform));
            let data = {
                "from" : sender,
                "destinations" : [{"to":phone}],
                "text" : message,
                "flash" : false,
                "intermediateReport" : true,
                "notifyUrl" : env.SERVER_BASE + '/api/sms/infobip/notify',
                "notifyContentType" : 'application/json',
                "validityPeriod" : 24 * 60, //  24 hours
            };
            var tosend = {
                "bulkId": 'tracksend-bulk', // 'CMPGN-' + cpn.id + '-' + counter,
                "messages": [data],
                "tracking": {
                    "track" : 'SMS', // q_tracking_track,
                    "type" : 'sms_notification', //q_tracking_type,
                }, 
            }

            params = {
                url: url || 'https://'+tracksend_base_url+'/sms/2/text/advanced',
                json: tosend,
                headers: {
                    'Authorization': 'Basic ' + base64encode,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        }

        console.log('____________________ PARAMS = ' + JSON.stringify(params));
        
        
        try {
            let ret = await axios({
                method: 'POST',
                url: params.url,
                data: params.json,
                headers: params.headers
            })

            /* let ret = {
                status: 200
            } */
            /* let ret = await request.post(params, async (err, response) => {
                if(err) {
                    console.log('---' + err);
                    console.log('j---' + JSON.stringify(err));
                    
                    return err
                }
                else {
                    console.log('-+-+-' + response);
                    console.log('j-+-+-' + JSON.stringify(response));
                    return response;
                }
            }); */
            let seen = [];
            console.log('1a~~~d~~~e~~~l~~~e~~~~')
            console.log('1a~~~~~~~~~~~~~~~~' + JSON.stringify(ret, function (key, val) {
                if (val != null && typeof val == "object") {
                    if (seen.indexOf(val) >= 0) {
                        return;
                    }
                    seen.push(val);
                }
                return val;
            }));
            return ret;
        } catch(err) {
            console.log('1b~~~~~~~~~~~~~~~~' + err);
            console.log('j1b~~~~~~~~~~~~~~~~' + JSON.stringify(err));
            return err;
        }
        /* .then(res => {
            console.log('respons = ' + JSON.stringify(res.data.code));
        }) */
        
        
        /* let ret = await request.post(body, async (err, response) => {
            if(err) {
                console.log('---' + JSON.stringify(err));
                
                return err
            }
            else {
                console.log('-+-+-' + JSON.stringify(response));
                return response;
            }
        }); */
        
    }

    if(platform == 'messagebird') {
        if(message) {
            params = {
                "originator" : sender,
                "recipients" : phone,
                "body"       : message,
                "type"       : 'sms',
                "mclass"     : 1,
                "reference"  : 'sms_notification',
                "reportUrl"  : env.SERVER_BASE + '/api/sms/messagebird/notify/',
                "validity"   : 2 * 24 * 60 * 60, //  48 hours ...in seconds
            }
        }

        let ret = await messagebird.messages.create(params, async function (err, response) {
            if(err) return err;
            else return response
        });

        console.log('2~~~~~~~~~~~~~~~~' + JSON.stringify(ret));
        return ret;
    }

    if(platform == 'africastalking') {
        const sms = africastalking.SMS;
        console.log('afrikastalking -- aa: ' + JSON.stringify(params));

        if(message) {
            
            params = {
                "username"  : "sandbox",        //  correct this
                "from"      : sender,
                "to"        : phone,
                "message"   : message,
            }
            console.log('afrikastalking -- bb: ' + JSON.stringify(params));
        }
        let ret = await sms.send(params)
        .then(async response => {
            return response;
        })
        .catch(err => {
            return err;
        });

        return ret;
    }

}

module.exports = sendSMS;
    