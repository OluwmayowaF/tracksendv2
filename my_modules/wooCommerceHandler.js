var models = require('../models');
const { default: axios } = require('axios');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;


const wooCommerceHandlers = () => {

    const getWooCommerceStatus = async (user_id) => {

        let active = false; 
        let error = null; 

        try {
            if(user_id.length == 0)  throw "error";
        }catch (e){
            return {
                active, 
                error: 'Authentication Error!'
            }
        }

        let wcstatus = await models.User.findByPk(user_id, {
            attributes:['wc_active'],
            raw: true
        });

        console.log(JSON.stringify(wcstatus.wc_active))
        if (JSON.stringify(wcstatus.wc_active) == 0){
            return false 
        }
        return true;
    }

    const getPluginStatus = async (woocommerce) => {
        
        console.log('WC_INT -- Checking Tracksend Plugin Status on User Store --')
        let pluginStatus =
         woocommerce.get("settings/tracksend")
        .then((response) => {
          return response  
        })
        .catch((error) => {
          console.log('WC_INT: Plugin Not Activated or wrong details');
         return error
        });
        return pluginStatus;
      
    }

    const updateUserWoocommerceTable = async (userid, consumerkey, consumersecret, storeurl, apikey) =>{
        console.log('WC_INT: Updating Database')
        const woocommerceData = await models.UserWoocommerceData.create({
            userId: userid,
            consumerKey: consumerkey,
            consumerSecret: consumersecret,
            storeUrl: storeurl
        })

        if (woocommerceData){
            // Update User Table
            await models.User.update(
                {  wc_active: 1,},
                {
                    where: {
                        id: userid,
                    }
                }
            );




        }

        

        return woocommerceData;

    }

    const connectToWooCommerceStore = async (req, res) => {
    
      console.log(
        "--------------- Start Connecting to store ------------------"
      );
      const WooCommerce = new WooCommerceRestApi({
        url: req.body.storeurl, // Your store URL
        consumerKey: req.body.consumerkey, // Your consumer key
        consumerSecret: req.body.consumersecret, // Your consumer secret
        version: "wc/v3", // WooCommerce WP REST API version
      });

      const pluginStatus = await getPluginStatus(WooCommerce);

      if(pluginStatus.data){
        console.log('WC_INT: Plugin Activated')
        const data = {
            value: req.body.apikey
          };
        // Plugin Exists Create DB Entry
        await updateUserWoocommerceTable(req.user.id, req.body.storeurl, req.body.consumerkey, req.body.consumersecret, req.body.apikey );
        console.log('WC_INT: Sending API KEY TO Woocommerce')
       const sendApiKey = await WooCommerce.put(`settings/tracksend/tracksend_api_key`, data)
       .then((response) => {
        const settings = response.data;
        return settings;
        })
        .catch((error) => {
            console.log(error.response.data);
        });

        if(sendApiKey.id !== 'tracksend_api_key'){
            res.send({
                error: {
                  status: 400,
                  response:
                    "Error: Confirm your credentials and make sure the tracksend plugin is installed ",
                },
              });
           
        }
        console.log('WC_INT: Connection Established')
        res.send({
            data: {
              status: 200,
              response: "Success: Connection established with store",
            },
          });


      }else{
        res.send({
            error: {
              status: 400,
              response:
                "Error: Confirm your credentials and make sure the tracksend plugin is installed ",
            },
          });
          console.log(pluginStatus.response.data)
      }

     
        
       

       
     

      return;
    };



    return { getWooCommerceStatus, connectToWooCommerceStore }

}

module.exports = wooCommerceHandlers;