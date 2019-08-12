var express = require('express');
var router = express.Router();
var topupController = require('../controllers/TopupController');

// Home page route.
router.get('/', topupController.index);
router.post('/pay', topupController.pay);
router.post('/ref', topupController.ref);
// router.post('/add', senderIdController.add);


module.exports = router;