/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

var models = require('../models');
const { default: axios } = require('axios');
const { APIKEY } = require('../config/cfg/chatapi')();

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
        console.log('db returns: ' + wainstance);
        console.log('====================================');
        var instance_id = wainstance.wa_instanceid;
        var api_url = wainstance.wa_instancetoken;
        var api_token =  wainstance.wa_instanceurl;

        if(instance_id.length > 0) {

        let url = api_url + '/status?token=' + api_token;

        try {
            var resp = await axios.get(url);
        } catch (e) {
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
    var api_url = wainstance.wa_instancetoken;
    var api_token =  wainstance.wa_instanceurl;

    if(instance_id.length == 0) {
        //  IF NO INSTANCE (ID) EXISTS, CREATE A NEW INSTANCE FOR USER

        console.log('====================================');
        console.log('NO INSTANCE ID');
        console.log('====================================');

        let new_url = "https://us-central1-app-chat-api-com.cloudfunctions.net/newInstance";
        let data = {
            "uid": APIKEY,
            "type": "whatsapp"
        }

        try {
            const new_resp = await axios.post(new_url, data);
            
            console.log('====================================');
            console.log('NEW INSTANCE CREATED: ' + JSON.stringify(new_resp.data));
            console.log('====================================');
            
            if(new_resp.data.result.status == "created") {

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
                
            } else throw "Instance Creation Error";
        } catch (e) {
            return ({
                code,
                error: "Authentication Error!!!" + " | " + e
            });
        }

    }

    //  NOW GET STATUS/QRCODE OF INSTANCE

    var qrcode = null;
    // var url = 'https://eu2.chat-api.com/instance' + instance_id + '/status?token=' + api_token;
    var url = api_url + '/status?token=' + api_token;

    try {
        var resp = await axios.get(url);
    } catch (e) {
        return({
            code,
            error: "Remote Connection Error!!!" + " | " + e
        });
    }
    
    let body = resp.data;

    if(body.accountStatus && body.accountStatus == "authenticated") {
        return ({
            code : 'exists',
            error,
        });
    } else if(body.qrCode) {  
        qrcode = body.qrCode;
        return ({
            code : qrcode,
            error,
        });
    }

    }

    return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };
}

module.exports = whatsappHandlers;
