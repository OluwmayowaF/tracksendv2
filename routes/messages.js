var express = require('express');
var router = express.Router();
var msgOptinController = require('../controllers/MessageOptinController');

// Home page route.
// router.get('/optin', msgOptinController.optin);
router.get('/optin/:subid', msgOptinController.postOptin);  //  deprecated: general optin for users
router.get('/optin',        msgOptinController.postOptin);  //  from tsnwhatsappoptin msg optin link is clicked
router.post('/complete',    msgOptinController.completeOptin);

router.get('/optout/:kid',  msgOptinController.preOptout);
router.post('/optout',      msgOptinController.postOptout);

module.exports = router;