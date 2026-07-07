require('dotenv').config()
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { json } = require('express');
const tokenBlacklistModel = require('../models/blackList.model')

async function authMiddleware(req, res, next) {

    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1]

    // console.log(token);

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized access, token is missing'
        });
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isBlacklisted) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized access'
            })
        }

        req.user = user

        next()
    }
    catch (error) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {

    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized access, token is missing'
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isBlacklisted) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select('+systemUser')

        // check if the user has admin access
        if (!user.systemUser) {
            return res.status(403).json({
                message: 'Forbidden access, not a system user'
            })
        }

        req.user = user

        next()
    }
    catch (err) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}