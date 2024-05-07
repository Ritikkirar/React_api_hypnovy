const mongoose = require("mongoose")


const truckSchema = mongoose.Schema({
    truck_name: {
        type: String,
        required: true,
        set: capitalizeSetter
    },
    truck_no: {
        type: String,
        required: true
    },
    truck_type: {
        type: String,
        required: true
    },
    truck_insurance_amount: {
        type: Number,
        required: true
    },
    truck_image: {
        type: String,
        required: true
    },
    truck_document: {
        type: String,
        required: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Routes",
        required: true
    },
    availability_status: {
        type: String,
        default: 'Available'
    },
    Requests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
    }],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    Active: {
        type: Boolean,
        default: 1
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
})

function capitalizeSetter(value) {
    if (typeof value === 'string') {
        const words = value.split(' ');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ');
    }
    return value;
}

const Truck = mongoose.model('Truck', truckSchema);

module.exports = Truck;