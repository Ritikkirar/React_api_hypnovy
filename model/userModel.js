const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();


const userSchema = mongoose.Schema({
  officer_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    set: capitalizeSetter
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: Number,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    required: true
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Routes",
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  date_of_birth: {
    type: String,
    required: true
  },
  officer_type: {
    type: String,
    required: true
  },
  officerImage: {
    type: String,
  },
  coDriver: {
    type: String
  },
  gunMen: {
    type: String
  },
  messenger: {
    type: String
  },
  truck_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Truck"
  },
  updatePass: {
    type: Boolean,
    default: false
  },
  Requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request"
  }],
  notifyToken: { type: String },
  user_signature: { type: String },
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


userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hashSync(this.password, 12);
  }
  next();
})

userSchema.methods.generateAuthToken = async function () {
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

const User = mongoose.model('User', userSchema);

module.exports = User;