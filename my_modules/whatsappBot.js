 /* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

var models = require('../models');
const { default: axios } = require('axios');
var qs = require('qs');
var API = require('../config/cfg/chatapi')();

const whatsappBot = (req, res) => {

    var APIurl = '';
    var token = '';

    var json = req.body;
    var decoded = json.parse(json);

    if(decoded.message) {
      var messages = decoded.message;
      messages.forEach(message => {
        var text = message.body.split(' ');
        if(!message.fromMe) {
          switch (text[0].toLowerCase()) {
            case 'hi':     welcome(message.chatId, false); break;
            case 'chatid': showChatId(message.chatId, false); break;
            case 'time':   time(message.chatId, false); break;
            case 'me':     me(message.chatId, message.senderName); break;
            case 'file':   file(message.chatId, ); break;
            case 'ptt':    ptt(message.chatId, ); break;
            case 'geo':    geo(message.chatId, ); break;
            case 'group':  group(message.chatId, ); break;
            default:       welcome(message.chatId, true); break;
          }
        }
      });
    }


    const welcome = async (chatId, noWelcome = false) => {

      var welcomeString = (noWelcome) ? "Incorrect command\n" : "WhatsApp Demo Bot NodeJS\n";
      sendMessage(chatId, welcomeString +
        "Commands:\n" +
        "1. chatid - show ID of the current chat\n" +
        "2. time - show server time\n" +
        "3. me - show your nickname\n" +
        "4. file [format] - get a file. Available formats: doc/gif/jpg/png/pdf/mp3/mp4\n" +
        "5. ptt - get a voice message\n" +
        "6. geo - get a location\n" +
        "7. group - create a group with the bot"
      );
    }

    const showChatId = async (chatId) => {
      sendMessage(chatId, 'ChatID: ' + chatId);
    }

    const time = async (chatId) => {
      sendMessage(chatId, new Date());
    }

    const me = async (chatId, name) => {
      sendMessage(chatId, name);
    }

    const file = async (chatId, format) => {

      let availableFiles = {
        'doc' : 'document.doc',
        'gif' : 'gifka.gif',
        'jpg' : 'jpgfile.jpg',
        'png' : 'pngfile.png',
        'pdf' : 'presentation.pdf',
        'mp4' : 'video.mp4',
        'mp3' : 'mp3file.mp3'
      };

      if(availableFiles[format]) {
        let data = {
          'chatId'  : chatId,
          'body'    : 'https://domain.com/PHP/' + availableFiles[format],
          'filename': availableFiles[format],
          'caption' : 'Get your file ' + availableFiles[format]
        };

        sendRequest('sendFile', data);
      }

    }

    const ptt = async (chatId) => {
      let data = {
        'audio'  : 'https://domain.com/PHP/ptt.ogg',
        'chatId' : chatId
      };

      sendRequest('sendAudio', data);
    }

    const geo = async (chatId) => {
      let data = {
        'lat'     : 51.51916,
        'lng'     : -0.139214,
        'address' : 'Ваш адрес',
        'chatId'  : chatId
      };

      sendRequest('sendLocation', data);
    }

    const group = async (author) => {
      let phone = author.replace('@c.us', '');
      let data = {
        'groupName'   : 'Group with the bot PHP',
        'phones'      : phone,
        'messageText' : 'It is your group. Enjoy'
      };

      sendRequest('group', data);
    }

    const sendMessage = async (chatId, text) => {
      let data = {
        'chatId' : chatId,
        'body'   : text
      };

      sendRequest('message', data);
    }

    const sendRequest = async (method, data) => {
      let url = APIurl + method + '?token=' + token;
      if(data.isArray()){ 
        data = JSON.parse(data);
      }
      let response = await axios({
          method: 'POST',
          url: url,
          data: data,
          headers: {
          'Content-Type': 'application/json'
          }
      })

      console.log('====================================');
      console.log('AXIOS RESPONSE: ' + response);
      console.log('====================================');

        // $response = file_get_contents($url,false,$options);
      // file_put_contents('requests.log',$response.PHP_EOL,FILE_APPEND);
    }
}

    // return { getWhatsAppStatus, whatsAppRetrieveOrCreateInstance };

module.exports = whatsappBot;
