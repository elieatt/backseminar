const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');


const User = require('../models/userModel');
const { default: mongoose } = require('mongoose');

const signUpLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // limit each IP to 5 requests
    message: 'Too many sign up attempts from this IP, please try again later',
});

const signInLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests
    message: 'Too many sign in attempts from this IP, please try again later',
});

const renewTokenLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests
    message: 'Too many token renew attempts from this IP, please try again later',
});

const signUpSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    
});

// Function to sign up a new user
const signUpUser = async (req, res) => {
    try {
        // Validate the input values
        const { error, value } = signUpSchema.validate(req.body);
        if (error) {
            console.log(error);
            return res.status(400).json({
                error: error.message,
            });
        }

        const { email, password, name,  } = value;

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error       : 'Email already exists',
            });
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance
        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            email,
            password: hashedPassword,
            name,
            
        });

        // Save the new user to the database
        await newUser.save();
        return res.status(201).json({
            message: "sign up succeeded",
            user: newUser,

        });
    } catch (err) {
        return res.status(400).json({
            error: err.message,
        });
    }
};

// Function to decrypt a password using bcrypt
const decryptPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Function to sign in a user and generate a JSON Web Token
const signInUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            return res.status(400).json({
                error: 'Invalid login credentials',
            });
        }

        // Decrypt the password using bcrypt
        const passwordMatch = await decryptPassword(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({
                error: 'Invalid login credentials',
            });
        }

        // Generate a JSON Web Token
        const token = jwt.sign({ id: user.id }, process.env.JWTPRIVATE, { expiresIn: '1h' });

        return res.json({
            user: user,
            token: token,
        });
    } catch (err) {
        return res.status(400).json({
            error: err.message,
        });
    }
};

// Function to renew a JSON Web Token
const renewToken = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        // Verify the existing token
        const decodedToken = jwt.verify(token, process.env.JWTPRIVATE);
       
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp < decodedToken.exp) {
          return res.status(401).json({ error: 'Token has not expired' });
        }
        const userId = decodedToken.id;

        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                error: 'User not found',
            });
        }

        // Generate a new JSON Web Token with a new expiration time
        const newToken = jwt.sign({ id: user.id }, process.env.JWTPRIVATE, { expiresIn: '1h' });
        return res.status(200).json({
            token: newToken,
        });
    } catch (err) {
        return res.status(400).json({
            error: err.message,
        });
    }
};

module.exports = {
    signUpLimit,
    signInLimit,
    renewTokenLimit,
    cookieParser,
    signUpUser,
    signInUser,
    renewToken,
};