const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    date: {
        required: true,
        type: String
    },
    name: {
        type: String,
        required: true
    }
})

const HolidayDate = mongoose.model('HolidayDate', dataSchema, "Holiday_Dates")
module.exports = HolidayDate