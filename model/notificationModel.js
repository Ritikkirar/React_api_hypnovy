const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  requester: {
    type: String,
    enum: ['Merchant', 'User'],
    default: 'Merchant',
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: function () {
      if (this.requester === 'Merchant') {
        return 'Merchant';
      } else if (this.requester === 'User') {
        return 'User';
      }
    },
    // required: true,
  },
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  req_ID: { type: String },
  role: { type: String },
  isSeen: { type: Boolean, default: false },
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;