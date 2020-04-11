var models = require('../models');
const { default: axios } = require('axios');
var qs = require('qs');
var API = require('../config/cfg/chatapi')();
var env = require('../config/env');

/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
const whatsappHandlers = () => {

    const getWhatsAppStatus = async (user_id) => {

        var active = false;
        var error = null;

        try {
            if(user_id.length == 0)  throw "error";
        } catch (e) {
            return {
                active,
                error: "Authentication Error!!!"
            }
        }

        let wainstance = await models.User.findByPk(user_id, {
            attributes: ['wa_instanceid', 'wa_instancetoken', 'wa_instanceurl'],
            raw: true
        });

        console.log('====================================');
        console.log('db returns: ' + JSON.stringify(wainstance));
        console.log('====================================');
        var instance_id = wainstance.wa_instanceid;
        var api_url = wainstance.wa_instanceurl;
        var api_token =  wainstance.wa_instancetoken;

        if(false && instance_id && (instance_id > 1 || instance_id.length > 1)) {

            console.log('====================================');
            console.log('heerrrreeee' + instance_id);
            console.log('====================================');
            let url = api_url + '/status?token=' + api_token;

            try {
                var resp = await axios.get(url);
            } catch (e) {
                console.log('====================================');
                console.log('ERROR TO URL = ' + url + '...' + JSON.stringify(e));
                console.log('====================================');
                return {
                    active,
                    error: "Remote Connection Error!!!"
                }
            }

            let body = resp.data;

            console.log('CODE RETRIEVED: ');// + JSON.stringify(resp))

            if(body.accountStatus && body.accountStatus == "authenticated") {
                active = true;
            }
        }
        console.log('====================================');
        console.log('thereeeee; active = ' + active);
        console.log('====================================');

        return {
            active,
            error,
        };

    }

    const whatsAppRetrieveOrCreateInstance = async (user_id) => {

        var code = null;
        var error = null;

        try {
            if(user_id.length == 0)  throw "error";
        } catch (e) {
            return;
        }

        let wainstance = await models.User.findByPk(user_id, {
            attributes: ['wa_instanceid', 'wa_instancetoken', 'wa_instanceurl'],
            raw: true
        });

        var instance_id = wainstance.wa_instanceid;
        var api_url = wainstance.wa_instanceurl;
        var api_token = wainstance.wa_instancetoken;

        console.log('====================================');
        console.log('1111111');
        console.log('====================================');

        if(instance_id == 0 || instance_id.length == 0) {
            //  IF NO INSTANCE (ID) EXISTS, CREATE A NEW INSTANCE FOR USER

            console.log('====================================');
            console.log('NO INSTANCE ID');
            console.log('====================================');

            let new_url = "https://us-central1-app-chat-api-com.cloudfunctions.net/newInstance";
            let data = {
                "uid": API.APIKEY,
                "type": "whatsapp"
            }

            try {
                // const new_resp = await axios.post(new_url, data);
                console.log('====================================');
                console.log('API: ' + JSON.stringify(API.APIKEY));
                console.log('====================================');
                const new_resp = await axios({
                    method: 'POST',
                    url: new_url,
                    data: qs.stringify({
                        "uid": API.APIKEY,
                        "type": 'whatsapp'
                    }),
                    headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                
                
                console.log('====================================');
                console.log('NEW INSTANCE RESPONSE: ' + JSON.stringify(new_resp.data));
                console.log('====================================');
                
                if(new_resp.data.result && new_resp.data.result.status == "created") {

                    let instance_info = new_resp.data.result.instance;

                    //  store instance info in DB for User
                    await models.User.update(
                        {
                            wa_instanceid: instance_info.id,
                            wa_instancetoken: instance_info.token,
                            wa_instanceurl: instance_info.apiUrl,
                        },
                        {
                            where: {
                                id: user_id,
                            }
                        }
                    );

                    instance_id = instance_info.id;
                    api_url = instance_info.apiUrl;
                    api_token =  instance_info.token;

                    //  set webhook for instance
                    let wb_url = api_url + "/webhook?token=" + api_token;
                    const set_wbhk = await axios({
                        method: 'POST',
                        url: wb_url,
                        data: qs.stringify({
                            "webhookUrl": env.SERVER_BASE + "/api/whatsapphook?token=" + api_token,
                            // "webhookUrl": "http://dev2.tracksend.co/api/whatsapphook",
                        }),
                        headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    console.log('====================================');
                    console.log('WEBHOOK: ' + JSON.stringify(set_wbhk.data));
                    console.log('====================================');
    
                    
                } else if(new_resp.data.error) {
                    console.log('====================================');
                    console.log('CHAT-API INSTANCE CREATION ERROR: ' + new_resp.data.error);
                    console.log('====================================');

                    throw "Server Error";
                }
                else throw "Instance Creation Error";
            } catch (e) {
                console.log('====================================');
                console.log('ERRRRR: ' + e);
                console.log('====================================');
                return ({
                    code,
                    error: e
                });
            }

        }

        //  NOW GET STATUS/QRCODE OF INSTANCE

        var qrcode = null;
        // var url = 'https://eu2.chat-api.com/instance' + instance_id + '/status?token=' + api_token;
        var url = api_url + '/status?token=' + api_token;

        try {
            console.log('====================================');
            console.log('urlurl: ' + url);
            console.log('====================================');
            
            var resp = await axios.get(url);
        } catch (e) {
            console.log('====================================');
            console.log('error: ' + url);
            console.log('====================================');
            return({
                code,
                error: "Remote Connection Error!!!" + " | " + e
            });
        }
    
        let body = resp.data;
        console.log('====================================');
        console.log('22222222222' + JSON.stringify(body));
        console.log('====================================');
        if(body.accountStatus && body.accountStatus == "authenticated") {
            console.log('====================================');
            console.log('333333333');
            console.log('====================================');
            return ({
                code : 'exists',
                error,
            });
        } else if(body.accountStatus && body.accountStatus == "loading") {
            console.log('====================================');
            console.log('333333333');
            console.log('====================================');
            return ({
                code : 'exists',
                error,
            });
        } else if(body.qrCode) {  
            console.log('====================================');
            console.log('44444444444');
            console.log('====================================');
            qrcode = body.qrCode;
            return ({
                code : qrcode,
                error,
            });
        } else {
            console.log('====================================');
            console.log('NOTHINGGGGGGGGGGGGG');
            console.log('====================================');
        }

    }

    return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };
}

module.exports = whatsappHandlers;
