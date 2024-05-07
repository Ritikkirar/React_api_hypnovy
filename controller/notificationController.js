const { Socket } = require("socket.io");
const Notification = require("../model/notificationModel");
const Request = require("../model/requestSchema");

exports.createNotification = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { message, ID, adminID, req_ID, requester } = req.body;
    // Create a new notification
    const notification = new Notification({
      message: message,
      requester: requester,
      userid: ID,
      adminID: adminID,
      req_ID: req_ID,
    });

    const createNotification = await notification.save();
    res.json({ statusCode: 201, data: createNotification });
  } catch (err) {
    console.error(err);
    res.json({ statusCode: 500, message: "Internal server error" });
  }
};

exports.getNotification = async (req, res) => {
  try {
    const data = await Notification.find({}).populate("userid");
    res.json({
      statusCode: 200,
      message: "Notification SuccessFully Found",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.json({ statusCode: 500, message: "Internal Server error" });
  }
};

exports.getRequest = async (req, res) => {
  try {
    console.log("req.param._id", req.params._id);
    const data = await Request.findOne({ req_ID: req.params._id });
    console.log("data by navigation", data);
    if (data) {
      res.json({ statusCode: 201, message: "Request SuccessFully Found", data });
    } else {
      res.json({ statusCode: 200, message: "Request not Found", });
    }
  } catch (error) {
    console.log(error);
    res.json({ statusCode: 500, message: "Internal Server error" });
  }
}

exports.getnotificationcount = async (req, res) => {
  try {
    let notifications = await Notification.find({ isSeen: false }).populate('userid')
    console.log("notifications", notifications);
    res.json({ message: "get notification", data: notifications });
  } catch (error) {
    console.log("error", error);
    res.json({ message: "get error", error })
  }
};

exports.getnotificationcount = async (req, res) => {
  try {
    let notifications = await Notification.find({ isSeen: false }).populate(
      "userid"
    );
    // console.log("notifications", notifications);
    res.json({ message: "get notification", data: notifications });
  } catch (error) {
    console.log("error", error);
    res.json({ message: "get error", error });
  }
};

exports.UpdateNotification = async (req, res) => {
  try {
    let _id = req.params._id
    console.log("_id", _id);
    const data = await Notification.findByIdAndUpdate(_id, { isSeen: true }, { new: true })
    console.log("data", data);
    if (!data) {
      res.json({ statusCode: '401', message: 'Something Wrong' })
    } else {
      let notifications = await Notification.find({ isSeen: false }).populate('userid')

      res.json({ statusCode: '201', message: 'Seen Notification', data: notifications })
    }
  } catch (error) {
    console.log("error", error);
    res.json({ statusCode: "500", message: "Internal Server error" });
  }
};

exports.DeleteNotification = async (req, res) => {
  try {
    const data = await Notification.findByIdAndDelete(req.params._id);
    if (!data) {
      res.json({ statusCode: "401", message: "Something Wrong" });
    } else {
      res.json({ statusCode: "200", message: "Deleted Successfully" });
    }
  } catch (error) {
    res.json({ statusCode: "500", message: "Internal Server error" });
  }
};
