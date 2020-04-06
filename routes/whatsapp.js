var express = require('express');
var router = express.Router();
var whatsappController = require('../controllers/WhatsAppController');

// Home page route.
// router.get('/optin', whatsappController.optin);
router.get('/optin',      whatsappController.postOptin);
router.get('/optin/:kid', whatsappController.postOptin);
router.post('/complete',  whatsappController.completeOptin);

router.get('/optout/:kid', whatsappController.preOptout);
router.post('/optout',    whatsappController.postOptout);

module.exports = router;