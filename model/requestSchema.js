const mongoose = require("mongoose");

const currFieldSchema = mongoose.Schema({
    curr_type: { type: String },
    value: { type: String },
    no_of_curr_value: { type: String },
    total_value: { type: String }
});

const requestSchema = mongoose.Schema({
    req_ID: {
        type: String,
    },
    req_type: {
        type: String,
    },
    charge_type: {
        type: String,
    },
    pickup_datetime: {
        type: String,
    },
    withreturn: {
        type: String,
    },
    pickup_address: {
        type: String,
    },
    deposit_add_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Banks' },

    no_of_bags: { type: String },
    bags: [
        {
            bag_ID: { type: String },
            cash_amount: { type: Number },
            cheque_amount: { type: Number },
            coins_amount: { type: Number },
            bar_code: { type: String },
            subtotal: { type: Number },
            scaned: { type: Boolean, default: 0 },
        }
    ],
    grandTotal: { type: Number },
    status: { type: String, default: 'Pending' },
    zone: { type: String, ref: "Routes", },
    phone: { type: String },
    business_name: { type: String },
    merchant: {
        type: String,
        ref: "Merchant",
    },
    signature: { type: String },
    adminID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    pickedup_datetime: {
        type: String,
    },
    reached_datetime: {
        type: String,
    },
    deposit_datetime: {
        type: String,
    },
    merchant_signature: { type: String },
    isCaptured: { type: Boolean, default: 0 },
    customer_type: { type: String },
    rate: { type: Number },
    extraRate: { type: Number },
    signatory_name: { type: String, set: capitalizeSetter },
    insurance: { type: Number },
    truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck' },
    user: { type: String, ref: 'User' },
    DeclineReasons: { type: Array, default: [] },
    DeclineDes: { type: String, default: '' },
    assigneddate: { type: String, default: new Date().toLocaleDateString() },
    route: { type: String },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
});

function capitalizeSetter(value) {
    if (typeof value === 'string') {
        const words = value.split(' ');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ');
    }
    return value;
}

const Request = mongoose.model("Request", requestSchema);
module.exports = Request;