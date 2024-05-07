const mongoose = require('mongoose')

const bankSchema = mongoose.Schema(
    {
        bank_name: {
            type: String,
            required: true,
            set: capitalizeSetter
        },
        bank_address: {
            type: String,
            required: true
        },
        bank_phone: {
            type: String,
            required: true
        },
        contact_person: {
            type: String,
            required: true,
            set: capitalizeSetter
        }
    }
)

function capitalizeSetter(value) {
    if (typeof value === 'string') {
        const words = value.split(' ');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ');
      }
      return value;
  }

const Bank = mongoose.model('Banks', bankSchema)

module.exports = Bank;