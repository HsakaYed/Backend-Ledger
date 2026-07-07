const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendRegistrationEmail } = require('../services/email.service');
const tokenBlacklistModel = require('../models/blackList.model');

/**
  * - user register controller
  * - POST /api/v1/auth/register
*/
async function userRegisterController(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email, password, name } = req.body;

        const isExist = await userModel.findOne({
            email
        });

        if (isExist) {
            const error = new Error('User already exists');
            error.statusCode = 422;
            throw error;
        }

        const [user] = await userModel.create([{
            email, password, name
        }], { session });

        const token = jwt.sign({
            userId: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.cookie('token', token);

        await session.commitTransaction()
        await session.endSession()

        res.status(201).json({
            user: user,
            token: token
        })

        // confirmation email post successful account creation
        await sendRegistrationEmail(user.email, user.name);
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}

/**
 * - User Login Controller
 * - POST /api/v1/auth/login
*/

async function userLoginController(req, res, next) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({
            email
        }).select("+password");

        if (!user) {
            const error = new Error('Email or password is INVALID');
            error.statusCode = 401;
            throw error;
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            const error = new Error('Email or Password is INVALID');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            userId: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.cookie("token", token);

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })
    }
    catch (error) {
        next(error);
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(200).json({
            message: 'User logged out successfully'
        })
    }

    res.clearCookie('token')

    await tokenBlacklistModel.create({
        token: token
    })

    res.status(200).json({
        message: 'User logged out successfully'
    })
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}