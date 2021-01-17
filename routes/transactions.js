var express = require('express');
var router = express.Router();
var transactionController = require('../controllers/TransactionController.js');

// Home page route.
router.get('/', transactionController.index);
router.get('/transaction/download',   transactionController.download);  



module.exports = router;