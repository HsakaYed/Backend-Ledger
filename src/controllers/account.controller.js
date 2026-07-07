const { default: mongoose } = require('mongoose');
const accountModel = require('../models/account.model');
const jwt = require('jsonwebtoken');

async function createAccountController(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = req.user;

        // console.log(user);

        const [account] = await accountModel.create([{
            user: user._id
        }], { session })

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            account: account
        })
    }
    catch (error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

async function getUserAccountsController(req, res, next) {
    try {
        const accounts = await accountModel.find({
            user: req.user._id
        })

        if (accounts.length == 0) {
            return res.status(404).json({
                message: 'No account exists for this user'
            })
        }

        res.status(200).json({
            accounts
        })
    }
    catch (error) {
        next(error)
    }
}

async function getAccountBalanceController(req, res, next) {
    try {
        const { accountId } = req.params

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        })

        if (!account) {
            return res.status(404).json({
                message: 'Account not found'
            })
        }

        const balance = await account.getBalance()

        res.status(200).json({
            accountId: account._id,
            balance: balance
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}