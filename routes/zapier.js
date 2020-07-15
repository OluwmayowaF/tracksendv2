var express = require('express');
var router = express.Router();
var zapierController = require('../controllers/ZapierController');
var cors = require("cors");

router.options ('/triggerhook/new', cors());      //  
router.post  ('/triggerhook/new', cors(), zapierController.add);
router.delete('/triggerhook/del', zapierController.delete);
router.get   ('/triggerhook/testdata', zapierController.testdata);


module.exports = router;