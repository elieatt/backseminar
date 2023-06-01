const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const auth_check = require('../middlewares/auth_check');

router.post('/signup',userController.signUpLimit, userController.signUpUser);
router.post('/login', userController.signInLimit,userController.signInUser);
router.get('/renew'/*, userController.renewTokenLimit*/,userController.renewToken);
module.exports=router;