const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const auth_check = require('../middlewares/auth_check');

router.post('/signup', userController.signUpUser);
router.post('/login', userController.signInUser);
router.post('/renew', userController.renewToken);
module.exports=router;