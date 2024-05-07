const User = require('../model/userModel')
const bcrypt = require("bcrypt");
require("dotenv").config();
const Truck = require('../model/truckModel');
const fs = require("fs")
const Request = require("../model/requestSchema");
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const nodemailer = require("nodemailer");
const webpush = require("web-push");
const Merchant = require('../model/merchantModel');
var admin = require("firebase-admin");

const { io } = require('socket.io')
const Notification = require('../model/notificationModel')


exports.register = async (req, res) => {
  try {
    const { officer_id, officer_type, name, email, gender, mobile, password, user_signature, truck, date_of_birth, zone } = req.body;
    let officerImage = null;

    if (req.files.officerImage) {
      officerImage = `${process.env.FILEPATH}` + req.files['officerImage'][0].originalname;
      req.body.officerImage = officerImage;
    }
    if (req.files.signatureFile) {
      req.body.signatureFile = `${process.env.FILEPATH}` + req.files['signatureFile'][0].originalname;
    }

    const existUserByEmail = await User.findOne({ "$or": [{ email: email }, { mobile: mobile }] });
    const existUser = await User.findOne({ "$and": [{ officer_type: officer_type, truck_id: truck }] });
    const isSameID = await User.findOne({ officer_id: officer_id })

    if (existUserByEmail) {
      return res.json({
        statuscode: "401",
        message: "User Already Exists By This Email or Number"
      });
    } else if (existUser) {
      return res.json({
        statuscode: "401",
        message: "User Already Exists By This Officer Type or Truck"
      });
    } else if (isSameID) {
      return res.json({
        statuscode: "401",
        message: "Officer Id Should be Unique"
      });
    }

    let userSignature = null;

    if (user_signature) {
      const matches = user_signature.match(/^data:image\/([a-z]+);base64,/)
      const base64Data = user_signature.replace(matches[0], '')
      const decodedImage = Buffer.from(base64Data, "base64");
      const imageName = "Images_pdf" + Date.now() + ".jpg";
      const imagePath = "./images/" + imageName;

      fs.writeFile(imagePath, decodedImage, (err) => {
        if (err) throw err;
        console.log("Image saved successfully");
      });

      userSignature = `${process.env.FILEPATH}` + imageName;
    } else if (req.files && req.files.signatureFile) {
      userSignature = req.body.signatureFile;
    }

    const user = await User.create({
      officer_id,
      officer_type,
      name,
      email,
      gender,
      mobile,
      password,
      truck_id: truck,
      user_signature: userSignature,
      date_of_birth,
      officerImage,
      zone
    });

    if (user) {
      return res.json({
        statuscode: '201',
        message: "User Successfully Registered",
        data: user
      });
    } else {
      return res.json({
        statuscode: "400",
        message: "Invalid User Data"
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statuscode: "500",
      error: "Internal Server Error"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, notifyToken } = req.body;
    const user = await User.findOne({ email });

    // console.log("User", user)
    if (!user) {
      res.json({
        statuscode: "401",
        message: "user not found"
      })
    } else {

      if (!user.Active) {
        res.json({
          statuscode: "400",
          message: "User is disable"
        })
      } else {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          res.json({
            statuscode: "300",
            message: "invalid email or password"
          })
        }
        else {
          const truckid = user.truck_id

          const officers = await User.find({ truck_id: truckid });

          const officersname = officers.map((item) => { return obj = { officer_name: item.name, officertype: item.officer_type } })
          console.log("officersname", officersname);
          let coDriver;
          let gunMen;
          let messenger;
          officersname.map(item => {
            // For Messenger
            if (user.officer_type == "Messenger") {
              if (item.officertype == "Driver") {
                coDriver = item.officer_name
              }
              if (item.officertype == "Shotgun") {
                gunMen = item.officer_name
              }
            }

            // For Driver
            if (user.officer_type == "Driver") {
              if (item.officertype == "Messenger") {
                messenger = item.officer_name
              }
              if (item.officertype == "Shotgun") {
                gunMen = item.officer_name
              }
            }

            //  For GunMen
            if (user.officer_type == "Shotgun") {
              if (item.officertype == "Messenger") {
                messenger = item.officer_name
              }
              if (item.officertype == "Driver") {
                coDriver = item.officer_name
              }
            }
          })
          let token = await user.generateAuthToken();
          console.log(token);
          user.token = token
          user.notifyToken = notifyToken;
          await user.save();

          let cookie = await res.cookie("jwttoken", token, {
            expiresIn: new Date(Date.now() + 25892000000),
            httpOnly: true,
            Secure: false,
          });

          let userdata = {
            _id: user._id,
            officer_id: user.officer_id,
            officer_type: user.officer_type,
            coDriver: coDriver,
            messenger: messenger,
            gunMen: gunMen,
            name: user.name,
            email: user.email,
            gender: user.gender,
            mobile: user.mobile,
            officerImage: user.officerImage,
            password: user.password,
            updatePass: user.updatePass,
            notifyToken: user.notifyToken,
            truck: user.truck,
            Active: user.Active,
            token,
          }
          console.log("userdata", userdata);
          res.json({
            statuscode: "201",
            data: userdata,
            message: "success"
          })
        }
      }
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.userID._id)
    if (user) {
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        res.json({
          statuscode: "401",
          message: "Don't Use Previous password "
        })

      } else {
        user.password = req.body.password;
        user.updatePass = req.body.updatePass
      }
      const updatedUser = await user.save();
      console.log("updatedUser", updatedUser);
      res.json({
        statuscode: "201",
        data: updatedUser
      });
    } else {
      res.json({
        statuscode: "400",
        message: "User not found"
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      message: JSON.stringify(error)
    })
  }
}

exports.getUsers = async (req, res) => {
  try {

    let users = await User.find({}).populate('truck_id').sort({ created_at: 1 })

    if (users.length === 0) {
      res.json({ statuscode: "401", message: "Users not found" })
    } else {
      res.json({
        statuscode: "201",
        message: "Success",
        data: users
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.getUserById = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.params._id })

    if (!user) {
      res.json({
        statuscode: "401",
        message: "User not exist"
      })
    } else {
      res.json({
        statuscode: "201",
        message: "User Succesfully found",
        data: user
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.updateUser = async (req, res) => {
  try {
    if (req.file) {
      req.body.officerImage = `${process.env.FILEPATH}` + req.file.originalname;
    }
    const { _id, officer_id, officer_type, name, email, gender, mobile, zone, truck, date_of_birth } = req.body;

    const truckdetails = await Truck.findOne({ _id: truck });
    console.log("truckdetails", truckdetails);

    const user = await User.findById(_id);
    console.log("user", user);

    if (!user) {
      return res.json({
        statuscode: "404",
        message: "User Not Exist"
      });
    }

    const isSameTruck = user.truck_id && user.truck_id.equals(truckdetails._id);

    if (isSameTruck && user.officer_type === officer_type) {
      const updatedUser = await User.findByIdAndUpdate(_id, {
        officer_id,
        officer_type,
        name,
        email,
        gender,
        mobile,
        zone,
        truck_id: truckdetails._id,
        date_of_birth,
        officerImage: req.body.officerImage,
      }, {
        new: true
      });

      if (!updatedUser) {
        return res.json({
          statuscode: "404",
          message: "User Not Exist"
        });
      }

      res.json({
        statuscode: "201",
        message: "User Successfully Updated",
        data: updatedUser
      });
    } else {
      const existUser = await User.findOne({ "$and": [{ officer_type: officer_type, truck_id: truck }] });

      if (existUser) {
        return res.json({
          statuscode: "401",
          message: "User already exists with this officer type and truck"
        });
      }

      const updatedUser = await User.findByIdAndUpdate(_id, {
        officer_id,
        officer_type,
        name,
        email,
        gender,
        mobile,
        zone,
        truck_id: truckdetails._id,
        date_of_birth,
        officerImage: req.body.officerImage,
      }, {
        new: true
      });

      if (!updatedUser) {
        return res.json({
          statuscode: "404",
          message: "User Not Exist"
        });
      }

      res.json({
        statuscode: "201",
        message: "User Successfully Updated",
        data: updatedUser
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ statuscode: "500", error: error.message })
  }
}


exports.deleteUser = async (req, res) => {
  try {
    let user = await User.findByIdAndDelete(req.params._id)
    const merchantEmails = await Merchant.find({}, { email: 1 });
    const userEmails = merchantEmails.map(user => user.email);

    console.log("emails", userEmails)

    if (!user) {
      res.json({ statuscode: "401", message: "Something Wrong" })
    } else {
      let users = await User.find({}).populate('truck_id').sort({ created_at: 1 })
      var transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const filePath = user.officerImage.substring(user.officerImage.lastIndexOf('/') + 1)

      userEmails.forEach((email) => {
        const mailOptions = {
          from: process.env.FROM_ADDRESS,
          to: email,
          subject: 'Admin fired this officer',
          html: `<div style="background-color: #f3f4f6;padding: 1.5rem;">
          <div style="background-color:#fff;padding:1.5rem;">
          <div style="border-bottom:1px solid grey"><img src='cid:logo' alt='logo' style="width:150px;height:80px;"/></div>
          <div>
          <p style="color:black;line-height:1.5">
          <span style="font-weight:700">Officer Name : </span>${user.name}
          </p>
          <p style="color:black;line-height:1.5">
          <span style="font-weight:700">Officer Image : </span></p>
          <div style="border-bottom:1px solid grey"><img src='cid:officer_image' alt='logo' style="width:150px;height:80px;"/></div>
          </div>
          </div>
          </div>`,
          attachments: [
            {
              filename: 'logo.png',
              path: process.cwd() + '/images/logo.png',
              cid: 'logo' //same cid value as in the html img src
            },
            {
              filename: filePath,
              path: process.cwd() + '/images/' + filePath,
              cid: 'officer_image' //same cid value as in the html img src
            }
          ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      });

      res.json({
        statuscode: "201",
        message: "User Successfully Deleted",
        data: users
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.updateActiveValue = async (req, res) => {
  try {
    const { Active } = req.body;
    const _id = req.params._id;
    const activeData = await User.findByIdAndUpdate(_id, { Active }, {
      new: true,
    });
    if (activeData) {
      let users = await User.find({}).populate('truck_id').sort({ created_at: 1 })
      res.json({
        statuscode: "201",
        data: users
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.sendNotification = async (req, res) => {
  const subscription = req.body

  const publicVapidKey = 'BFCaDXbYmWy-W_P4HVB4qROsFpMnnf_jX-4QU6wi_xZtpSVK1Wad7TVQDGGYi8mvJfJ8zIj6KntU5QM0A9mGzBw'
  const privateVapidKey = 'HSkBYgCNZ34x4MtYYukrjdC1Y_F2w56n9usjwQxP_EA'

  console.log(subscription)
  webpush.setVapidDetails('mailto:shubhamvishwakarma4114@gmail.com', publicVapidKey, privateVapidKey)

  const payload = JSON.stringify({
    title: 'Hello!',
    body: 'It works.',
  })

  try {
    const data = await webpush.sendNotification(subscription, payload)
    res.json({ statuscode: "200", msg: "Send Notification SuccessFully !!", data: data })
  } catch (error) {
    console.log(error)
    res.json({ statuscode: "500", error: error })
  }
}

// exports.changeStatus = async (req, res) => {
//   try {
//     const { req_ID, status, officer_id, truckID } = req.body
//     // const io = req.app.get('io');
//     const { io } = req

//     console.log("req.body", req.body);
//     const currentDate = new Date();
//     if (status == 'Reached') {
//       const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, reached_datetime: new Date() }, { new: true })
//       res.json({ statuscode: "201", message: "status Update successfully", data })
//     } else if (status == 'PickedUp') {
//       const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, pickedup_datetime: new Date() }, { new: true })
//       console.log("************************ DATA ************************", data)
//       const populateData = await data.populate({
//         path: "truck", populate: { path: "Requests" }
//       })
//       const filterData = populateData.truck?.Requests?.filter(el => (
//         (new Date(el.pickedup_datetime).getTime() === currentDate.getTime() || el.status === "PickedUp")
//       )).reduce((sum, el) => sum + el.grandTotal, 0);
//       console.log("************ RESULT ************", filterData)
//       if (filterData >= populateData.truck?.truck_insurance_amount) {
//         console.log("********** inside condition **********")

//         const notificationMessage = `Insurance amount exceeded for truck: ${populateData.truck?.truck_name}`;
//         console.log("NotificationMessage", notificationMessage)

//         const notification = new Notification({
//           message: notificationMessage,
//           requester: "User",
//           userid: officer_id,
//           adminID: data.adminID,
//           req_ID: data.req_ID,
//           role: 'Admin'
//         });
//         console.log("notification", notification)
//         try {
//           const users = await User.find({ truck_id: truckID });
//           const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);

//           if (tokens.length > 0) {
//             const message = {
//               notification: { title: notificationMessage, body: "Get request", },
//               tokens: tokens,
//             }
//             const response = await admin.messaging().sendMulticast(message);
//             res.json({ statuscode: '400', message: 'Notification send successfully', data: response, })

//           } else {
//             res.json({ statuscode: '400', message: 'Users not login yet' })
//           }
//           const createNotification = await notification.save();

//           io.emit('poonam', createNotification);

//           console.log("Notification saved and emitted:", createNotification);
//         } catch (error) {
//           console.error("Error saving notification:", error);
//         }
//       }
//       res.json({ statuscode: "201", message: "status Update successfully", data })
//     }
//     else if (status == 'Completed') {
//       const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, deposit_datetime: new Date() }, { new: true })
//       res.json({ statuscode: "201", message: "status Update successfully", data })
//     }
//     else if (status == 'In Transit') {
//       const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status }, { new: true })
//       res.json({ statuscode: "201", message: "status Update successfully", data })
//     }

//   } catch (error) {
//     res.json({ statuscode: "500", message: "Internal Server Error", error: error });
//   }
// }

exports.changeStatus = async (req, res) => {
  try {
    const { req_ID, status, officer_id, truckID } = req.body;
    const { io } = req;

    console.log("req.body in change status",req.body);

    let response;

    const currentDate = new Date();
    if (status == 'Reached') {
      const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, reached_datetime: new Date(), user: officer_id }, { new: true });
      response = { statuscode: "201", message: "Status updated successfully", data };
    } else if (status == 'PickedUp') {
      const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, pickedup_datetime: new Date(), user: officer_id }, { new: true });
      console.log("updated data when status is pickedup", data);

      // Additional logic for PickedUp status
      const populateData = await data.populate({
        path: "truck", populate: { path: "Requests" }
      });
      console.log("populateData",populateData);
      // const filterData = populateData.truck?.Requests?.filter(el => (
      //   (new Date(el.pickedup_datetime).getTime() === currentDate.getTime() || el.status === "PickedUp")
      // )).reduce((sum, el) => sum + el.grandTotal, 0);

      // console.log("********** FilterData **********",filterData)

      // if (filterData >= populateData.truck?.truck_insurance_amount) {
      //   const notificationMessage = `Insurance amount exceeded for truck: ${populateData.truck?.truck_name}`;
      //   const notification = new Notification({
      //     message: notificationMessage,
      //     requester: "User",
      //     userid: officer_id,
      //     adminID: data.adminID,
      //     req_ID: data.req_ID,
      //     role: 'Admin'
      //   });

      //   try {
      //     const users = await User.find({ truck_id: truckID });
      //     const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);

      //     if (tokens.length > 0) {
      //       const message = {
      //         notification: { title: notificationMessage, body: "Get request" },
      //         tokens: tokens,
      //       };
      //       const response = await admin.messaging().sendMulticast(message);
      //       console.log("Notification sent successfully:", response);
      //     } else {
      //       console.log("No users logged in to receive notifications.");
      //     }

      //     const createNotification = await notification.save();
      //     io.emit('poonam', createNotification);
      //     console.log("Notification saved and emitted:", createNotification);
      //   } catch (error) {
      //     console.error("Error sending notification:", error);
      //   }
      // }
      const requests = populateData.truck?.Requests;
      let totalGrandTotalPickedUp = 0; // Variable to track total grandTotal of "PickedUp" requests

      if (requests && requests.length > 0) {
        const currentDate = new Date();

        requests.forEach(request => {
          if (request.status === "PickedUp") {
            const pickedupDate = new Date(request.pickedup_datetime);
            if (pickedupDate.getDate() === currentDate.getDate() &&
              pickedupDate.getMonth() === currentDate.getMonth() &&
              pickedupDate.getFullYear() === currentDate.getFullYear()) {
              totalGrandTotalPickedUp += request.grandTotal;
              console.log("request.grandTotal", request.grandTotal)
            }
          }
        });
        console.log("*******totalGrandTotalPickedUp*******", totalGrandTotalPickedUp)
        if (totalGrandTotalPickedUp >= populateData.truck?.truck_insurance_amount) {
          const notificationMessage = `Insurance amount exceeded for truck: ${populateData.truck?.truck_name}`;
          const notification = new Notification({
            message: notificationMessage,
            requester: "User",
            userid: officer_id,
            adminID: data.adminID,
            req_ID: data.req_ID,
            role: 'Admin'
          });

          try {
            const users = await User.find({ truck_id: truckID });
            const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);

            if (tokens.length > 0) {
              const message = {
                notification: { title: notificationMessage, body: "Get request" },
                tokens: tokens
                ,
              };
              const response = await admin.messaging().sendMulticast(message);
              console.log("Notification sent successfully:", response);
            } else {
              console.log("No users logged in to receive notifications.");
            }

            const createNotification = await notification.save();
            io.emit('poonam', createNotification);
            console.log("Notification saved and emitted:", createNotification);
          } catch (error) {
            console.error("Error sending notification:", error);
          }

          // Send the notification or perform necessary actions
        }
      }

      response = { statuscode: "201", message: "Status updated successfully", data };
    } else if (status == 'Completed') {
      const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status, deposit_datetime: new Date() }, { new: true });
      response = { statuscode: "201", message: "Status updated successfully", data };
    } else if (status == 'In Transit') {
      const data = await Request.findByIdAndUpdate({ _id: req_ID }, { status: status }, { new: true });
      response = { statuscode: "201", message: "Status updated successfully", data };
    } else {
      // Handle unknown status
      response = { statuscode: "400", message: "Invalid status" };
    }

    res.json(response);

  } catch (error) {
    res.status(500).json({ statuscode: "500", message: "Internal Server Error", error: error });
  }
};

exports.changeBarcodeStatus = async (req, res) => {
  try {
    const { req_ID, isCaptured, scaned } = req.body
    console.log("req.body", req.body);
    const data = await Request.findByIdAndUpdate({ _id: req_ID }, { isCaptured: isCaptured, $set: { 'bags.$[].scaned': scaned } }, { new: true })
    res.json({ statuscode: "201", message: " Bar Code status Update successfully", data })

  } catch (error) {
    res.json({ statuscode: "500", message: "Internal Server Error", error: error });
  }

}