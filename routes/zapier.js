var express = require('express');
var router = express.Router();
var zapierController = require('../controllers/ZapierController');

router.post  ('/triggerhook/new', zapierController.add);
router.delete('/triggerhook/del', zapierController.delete);
router.get   ('/triggerhook/testdata', zapierController.testdata);


module.exports = router;