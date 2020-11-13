var express = require('express');
var router = express.Router();
var zapierController = require('../controllers/ZapierController');
var cors = require("cors");

// router.options ('/triggerhook/new', cors());      //  
// router.post  ('/triggerhook/new', cors(), zapierController.add);
router.post  ('/triggerhook/subscribe',   zapierController.triggerHookAdd);
router.delete('/triggerhook/unsubscribe', zapierController.triggerHookRemove);

router.post  ('/action/contacts', zapierController.contactUpdate);
router.post  ('/action/groups',   zapierController.groupUpdate);
router.post  ('/action/optinout', zapierController.optinOptout);

router.get   ('/triggerhook/testdata', zapierController.testdata);
router.get   ('/triggerhook/contact/testdata', zapierController.testdata);



module.exports = router;