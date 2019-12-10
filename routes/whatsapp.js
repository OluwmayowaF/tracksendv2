var express = require('express');
var router = express.Router();
var whatsappController = require('../controllers/WhatsAppController');

// Home page route.
// router.get('/optin', whatsappController.optin);
router.get('/optin/:curl', whatsappController.postOptin);


module.exports = router;