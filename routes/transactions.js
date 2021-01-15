var express = require('express');
var router = express.Router();
var transactionController = require('../controllers/TransactionController.js');

// Home page route.
router.get('/', transactionController.index);



module.exports = router;