const request = require('request');
const { default: axios } = require('axios');
var env = require('../env');

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
    
    if(platform == 'infobip') {
        if(message) {
            console.log('======= ++++++ =======' + JSON.stringify(platform));
            let data = {
                "from" : sender,
                "destinations" : [phone],
                "text" : message,
                "flash" : false,
                "intermediateReport" : true,
                "notifyUrl" : env.SERVER_BASE + '/api/sms/infobip/notify',
                "notifyContentType" : 'application/json',
                "validityPeriod" : 24 * 60, //  24 hours
            };
            var tosend = {
                "bulkId": 'tracksend-bulk', // 'CMPGN-' + cpn.id + '-' + counter,
                "messages": data,
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
        
        try {
            let ret = await axios({
                method: 'POST',
                url: params.url,
                data: params.json,
                headers: params.headers
            })
            /* let ret = await request.post(params, async (err, response) => {
                if(err) {
                    console.log('---' + JSON.stringify(err));
                    
                    return err
                }
                else {
                    console.log('-+-+-' + JSON.stringify(response));
                    return response;
                }
            }); */
        console.log('1a~~~~~~~~~~~~~~~~' + JSON.stringify(ret));
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

        if(message) {
            params = {
                "from" : sender,
                "recipients" : phone,
                "message" : message,
            }
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
    