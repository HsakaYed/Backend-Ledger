const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()

/**
 * - Routes required
 */
const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.routes')
const transactionRouter = require('./routes/transaction.routes')
const errorMiddleware = require('./middleware/error.middleware')

app.use(cookieParser());
app.use(express.json());

/**
 * - Use Routes
 */
app.get('/', (req, res) => {
    res.send('Ledger Service is up and running')
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/accounts', accountRouter)
app.use('/api/v1/transactions', transactionRouter)


app.use(errorMiddleware);

module.exports = app;