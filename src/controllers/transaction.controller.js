const { default: mongoose } = require("mongoose")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const { sendTransactionEmail } = require("../services/email.service")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     ------ Under One Single Session ------
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     ----------- End Session --------------
     * 10. Send email notification
 */

async function createTransaction(req, res, next) {

    const session = await mongoose.startSession();

    try {
        /**
     * 1. Validate request
     */
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: 'FromAccount, toAccount, amount and idempotencyKey are required'
            })
        }
        const fromUserAccount = await accountModel.findOne({
            _id: fromAccount
        })

        const toUserAccount = await accountModel.findOne({
            _id: toAccount
        })

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: 'Invalid fromAccount or toAccount'
            })
        }

        /**
        * 2. Validate idempotency key
        */
        const isTransactionAlreadyExists = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        })

        if (isTransactionAlreadyExists) {
            if (isTransactionAlreadyExists.status === 'COMPLETED') {
                return res.status(200).json({
                    message: 'Transaction already processed',
                    transaction: isTransactionAlreadyExists
                })
            }

            if (isTransactionAlreadyExists.status === 'PENDING') {
                return res.status(200).json({
                    message: 'Transaction is still processing'
                })
            }

            if (isTransactionAlreadyExists.status === 'FAILED') {
                return res.status(500).json({
                    message: 'Transaction processing failed, please retry'
                })
            }

            if (isTransactionAlreadyExists.status === 'REVERSED') {
                return res.status(500).json({
                    message: 'Transaction was reversed, please retry'
                })
            }
        }

        /**
         * 3. Check account status
         */
        if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
            return res.status(400).json({
                message: 'Both fromAccount and toAccount must be ACTIVE to process transaction'
            })
        }

        /**
         * 4. Derive sender balance from ledger
         */
        const balance = await fromUserAccount.getBalance()

        if (balance < amount) {
            return res.status(400).json({
                message: `Insuffient balance. Current balance is ${balance}. Requested 
            amount is ${amount}`
            })
        }

        let transaction, updatedTransaction;

        try {
            session.startTransaction();
            /**
         * 5. Create transaction (PENDING)
         */
            /**
             * - Why use array form at all instead of (await transactionModel.create([ {
                 fromAccount,
                 toAccount,
                 amount,
                 idempotencyKey,
                 status: "PENDING"
                 } ], 
                 { session }))[ 0 ]
    ?
                 Because when you need to pass a session (for MongoDB transactions), Mongoose's 
                 create() has quirky overload behavior — passing a single object with { session } 
                 as the second arg can be ambiguous/misinterpreted as options merged into the doc 
                 in some versions/setups. Using the array form is the well-documented, reliable way 
                 to ensure { session } is treated as the options object, guaranteeing the operation 
                 participates in the transaction. The tradeoff is you then get an array back and must 
                 destructure [0].
             */
            [transaction] = await transactionModel.create([{
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status: 'PENDING'
            }], { session })

            /**
             * 6. Create DEBIT ledger entry
             */
            const [deditLedgerEntry] = await ledgerModel.create([{
                account: fromAccount,
                amount: amount,
                transaction: transaction._id,
                type: 'DEBIT'
            }], { session })

            // IIFE
            await (() => (
                new Promise((resolve) => setTimeout(resolve, 15 * 1000))
            ))()

            /**
             * 7. Create CREDIT ledger entry
             */
            const [creditLedgerEntry] = await ledgerModel.create([{
                account: toAccount,
                amount: amount,
                transaction: transaction._id,
                type: 'CREDIT'
            }], { session })

            /**
             * 8. Mark transaction COMPLETED
             */
            updatedTransaction = await transactionModel.findOneAndUpdate(
                { _id: transaction._id },
                { status: 'COMPLETED' },
                { session, returnDocument: 'after' }    // <-- returns the updated doc
            )

            /**
             * 9. Commit MongoDB session
             */
            await session.commitTransaction()
            session.endSession()
        }
        catch (error) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({
                message: 'Transaction is Pending due to some issue, please retry after sometime'
            })
        }
        /**
         * 10. Send email notification to both sender and receiver
         */
        // Anything below this line must NOT trigger session.abortTransaction()
        try {
            await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
        } catch (emailErr) {
            console.error('Transaction succeeded but email failed:', emailErr);
            // don't fail the request just because the email failed
        }

        return res.status(201).json({
            message: 'Transaction completed successfully',
            transaction: updatedTransaction
        })
    }
    catch (error) {
        next(error);
    }
}

// initial funds need to be present in an to initiate the first trnsaction
async function createInitialFundsTransanction(req, res, next) {

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { toAccount, amount, idempotencyKey } = req.body
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: 'toAccount, amount and idempotencyKey are required'
            })
        }

        const toUserAccount = await accountModel.findById({
            _id: toAccount
        })

        if (!toUserAccount) {
            return res.status(400).json({
                message: 'Invalid toAccount'
            })
        }

        const fromUserAccount = await accountModel.findOne({
            // admin user id
            user: req.user._id
        })

        if (!fromUserAccount) {
            return res.status(400).json({
                message: 'System user account not found'
            })
        }

        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
        }], { session })

        // sender account ledger
        const [debitLedgerEntry] = await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: 'DEBIT'
        }], { session })

        // receiver account ledger
        const [creditLedgerEntry] = await ledgerModel.create([{
            account: toUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: 'CREDIT'
        }], { session })

        transaction.status = 'COMPLETED'
        await transaction.save({ session })

        await session.commitTransaction()
        session.endSession()

        res.status(201).json({
            message: 'Initial funds transaction completed successfully',
            transaction: transaction
        })
    }
    catch (error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransanction
}