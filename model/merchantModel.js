const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config()

const merchantSchema = mongoose.Schema(
  {
    business_name: {
      type: String,
      required: true,
      set: capitalizeSetter
    },
    userName: {
      type: String,
    },
    type: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routes",
      // required: true
    },
    service_type: [
      {
        type: String,
      }
    ],
    maxLimit: {
      type: Number
    },
    holiday_services: {
      type: Boolean,
      default: 0
    },
    weekly_service: [
      {
        day_type: { type: String },
        services: [
          {
            name: String,
            price: String,
            start: String,
            end: String
          },
          {
            name: String,
            price: String,
            start: String,
            end: String
          }
        ]
      }
    ],
    selected_banks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Banks',
        required: true
      }
    ],
    contactPerson: {
      type: String,
      required: true,
      set: capitalizeSetter
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: Number,
      required: true,
      unique: true
    },
    contactPerson_sec: {
      type: String,
      set: capitalizeSetter
    },
    contact_email_sec: {
      type: String,
      sparse: true
    },
    phone_sec: {
      type: Number,
      sparse: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    merchant_images: {
      type: String,
      default:''
    },
    adminID: {
      type: String,
    },
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
  }
);

merchantSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
})

merchantSchema.methods.generateAuthToken = async function () {
  try {
    const token = jwt.sign({ _id: this._id }, `${process.env.SECRET_KEY}`, { expiresIn: "345600s", });
    return token;
  } catch (err) {
    console.log(err);
  }
}

function capitalizeSetter(value) {
  if (typeof value === 'string') {
      const words = value.split(' ');
      const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
      return capitalizedWords.join(' ');
    }
    return value;
}

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;