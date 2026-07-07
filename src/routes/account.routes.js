const express = require('express')
const { authMiddleware } = require('../middleware/auth.middleware')
const { createAccountController, getAccountBalanceController,
    getUserAccountsController } = require('../controllers/account.controller')

const accountRouter = express.Router()

/**
 * - POST /api/v1/accounts/
 * - Create a new account
 * - Protected Route
*/
accountRouter.post('/', authMiddleware, createAccountController)

/**
 * - GET /api/accounts/
 * - get all accounts of the logged-in user
 * - Protected Route
 */
accountRouter.get('/', authMiddleware, getUserAccountsController)

/**
 * - GET /api/accounts/balance/:accountId
 */
accountRouter.get('/balance/:accountId', authMiddleware, getAccountBalanceController)

module.exports = accountRouter
