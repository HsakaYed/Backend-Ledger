const express = require('express')

const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware')
const { createTransaction, createInitialFundsTransanction } = require('../controllers/transaction.controller')

const transactionRouter = express.Router()

/**
 * - POST /api/transactions/
 * - Create a new transaction between two active account holder
 * - Protected Route
 */
transactionRouter.post('/', authMiddleware, createTransaction)

/**
 * - POST /api/v1/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRouter.post('/system/initial-funds', authSystemUserMiddleware, createInitialFundsTransanction)

module.exports = transactionRouter