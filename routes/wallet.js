var express = require('express');
var router = express.Router();
var walletController = require('../controllers/WalletController');

// Home page route.
router.get('/', walletController.index);
router.post('/pay', walletController.pay);
router.get('/ref', walletController.ref);
router.get('/error', walletController.errpg);
// router.post('/add', senderIdController.add);


module.exports = router;