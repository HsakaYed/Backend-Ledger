const mongoose = require('mongoose');
const ledgerModel = require('../models/ledger.model')

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'Account must be associated with a user'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'FROZEN', 'CLOSED'],
            message: 'Status can be either ACTIVE, FROZEN or CLOSED',
        },
        default: 'ACTIVE'
    },
    currency: {
        type: String,
        required: [true, 'Currency is required for creating an account'],
        default: 'INR'
    }
}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 });

// method for each schema instances
accountSchema.methods.getBalance = async function () {

    // .aggregate() on ledgerModel, passing an array of pipeline stages. 
    // Each stage runs in order, feeding its output into the next.
    const balanceData = await ledgerModel.aggregate([

        // Stage 1 — $match: Filters the collection down to only documents 
        // where the account field equals this._id (the current account instance).
        {
            $match: {
                account: this._id
            }
        },

        // Stage 2 — $group: Groups the matched documents together. Setting _id: null 
        // means "don't split into separate buckets — collapse everything into a single 
        // group," since we want one overall total rather than a per-account or per-type 
        // breakdown.
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            {
                                $eq: ['$type', 'DEBIT']
                            },
                            '$amount',
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            {
                                $eq: ['$type', 'CREDIT']
                            },
                            '$amount',
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: {
                    $subtract: [
                        '$totalCredit', '$totalDebit'
                    ]
                }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance;
}

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;