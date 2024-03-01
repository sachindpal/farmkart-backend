var express = require('express');
var router = express.Router();
var auth = require('./../middleware/Auth')
var AuthController = require('./../controllers/AuthController')
/* GET home page. */
// router.get('/',authToken.generateAccessToken,AuthController.login );
router.post('/login',AuthController.login );

module.exports = router;
