var express = require('express');
var router = express.Router();
const multer = require('multer');
var uploadController = require('../controllers/UploadController');

const upload = multer({ dest: 'tmp/csv/' });

// Home page route.
router.get('/', uploadController.index);
router.post('/validate', uploadController.validate);
router.post('/load', upload.single('file'), uploadController.do);
// router.post('/add', senderIdController.add);


module.exports = router;