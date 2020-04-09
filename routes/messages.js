var express = require('express');
var router = express.Router();
var msgOptinController = require('../controllers/MessageOptinController');

// Home page route.
// router.get('/optin', msgOptinController.optin);
router.get('/optin',      msgOptinController.postOptin);
router.get('/optin/:kid', msgOptinController.postOptin);
router.post('/complete',  msgOptinController.completeOptin);

router.get('/optout/:kid', msgOptinController.preOptout);
router.post('/optout',    msgOptinController.postOptout);

module.exports = router;