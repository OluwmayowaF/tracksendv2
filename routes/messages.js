var express = require('express');
var router = express.Router();
var msgOptController = require('../controllers/MessageOptController');

// Home page route.
// router.get('/optin', msgOptController.optin);
router.get('/optin',      msgOptController.postOptin);
router.get('/optin/:kid', msgOptController.postOptin);
router.post('/complete',  msgOptController.completeOptin);

router.get('/optout/:kid', msgOptController.preOptout);
router.post('/optout',    msgOptController.postOptout);

module.exports = router;