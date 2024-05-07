require("dotenv").config();
const Admin = require("../model/adminModel");
const Merchant = require("../model/merchantModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const HolidayDate = require("../model/datemodel");
const Bank = require("../model/bankModel");
const fs = require("fs");
const path = require("path");
var admin = require("firebase-admin");
var serviceAccount = require("../platinumsecurity-430d3-firebase-adminsdk-hj5nn-a2a195368f.json");
const Truck = require("../model/truckModel");
const User = require("../model/userModel");
const Request = require("../model/requestSchema");
const Notification = require("../model/notificationModel");
const moment = require("moment");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.adminRegister = async (req, res) => {
  try {
    const { admin_name, email, password } = req.body;

    const existAdmin = await Admin.findOne({ email });

    if (existAdmin) {
      res.json({
        statuscode: "401",
        message: "Already Exist",
      });
    }
    const admin = await Admin.create({
      admin_name,
      email,
      password,
    });

    if (admin) {
      res.json({
        statuscode: "201",
        _id: admin._id,
        admin_name: admin.admin_name,
        email: admin.email,
        password: admin.password,
      });
    } else {
      res.json({
        statuscode: "400",
        message: "Invalid Data",
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  const merchant = await Merchant.findOne({ email: email });

  if (admin) {
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      res.json({ statuscode: "401", message: "invalid email or password" });
    } else {
      let token = await admin.generateAuthToken();
      let cookie = await res.cookie("jwttoken", token, {
        expires: new Date(Date.now() + 25892000000),
        httpOnly: true,
        Secure: false,
      });

      const admindata = {
        _id: admin._id,
        admin_name: admin.admin_name,
        role: admin.role,
        token,
      };

      res.json({
        statuscode: "201",
        status: true,
        message: "User Successfully Login ",
        data: admindata,
      });
    }
  } else if (merchant) {
    if (!merchant.Active) {
      res.json({
        statuscode: "400",
        message: "User is disable",
      });
    } else {
      const isMatch = await bcrypt.compare(password, merchant.password);

      if (!isMatch) {
        res.json({
          statuscode: "401",
          message: "invalid email or password",
        });
      } else {
        let token = await merchant.generateAuthToken();
        // console.log(token);

        let cookie = await res.cookie("jwttoken", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: true,
          Secure: false,
        });

        const merchantdata = {
          _id: merchant._id,
          business_name: merchant.business_name,
          type: merchant.type,
          token,
        };
        res.json({
          statuscode: "201",
          status: true,
          message: "User Successfully Login ",
          data: merchantdata,
        });
      }
    }
  } else {
    res.json({ statuscode: "500", message: "Invalid email or password" });
  }
};

exports.getAdminDetails = async (req, res) => {
  try {
    console.log("id", req.params._id);
    const adminDetails = await Admin.findOne({ _id: req.params._id });
    console.log("adminDetails", adminDetails);

    if (!adminDetails) {
      res.json({
        statuscode: "404",
        message: "Not Found",
      });
    } else {
      res.json({
        statuscode: "201",
        message: "Successfully Found",
        data: adminDetails,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    let admin = await Admin.findByIdAndDelete(req.params._id);
    if (!admin) {
      res.json({ statuscode: "400", message: "Something Wrong" });
    } else {
      res.json({ statuscode: "201", message: "Admin successfully Deleted" });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.forgotpassword = async function (req, res) {
  const { email } = req.body;
  try {
    let admin = await Admin.findOne({ email });
    let merchant = await Merchant.findOne({ email });

    if (admin) {
      console.log("admin condition in forgot password", admin);
      //  token generate for reset password
      const token = jwt.sign({ _id: admin._id }, process.env.SECRET_KEY, {
        expiresIn: "600s",
      });

      console.log("admin token in forgot password", token);

      if (token) {
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

        const mailOptions = {
          from: process.env.FROM_ADDRESS,
          to: email,
          subject: "Reset Your password for Platinum Security!",
          html: `<div style="background-color: #f3f4f6;padding: 1.5rem;">
                    <div style="background-color:#fff;padding:1.5rem;">
                    <div style="border-bottom:1px solid grey">
                    <img src='cid:logo' alt='logo' style="width:150px;height:80px;"/></div>
                    <div><h3 style="color:black">Reset Password</h3>
                    <p style="color:black;line-height:1.5">A password reset event has been triggered. The password reset window is limited to 10 minutes.
                    If you do not reset your password within 10 minutes, you will need to submit a new request.
                    To complete the password reset process, visit the following link:</p>
                   <p> http://platinum-security-2031565007.us-east-1.elb.amazonaws.com/platinumsecurity/#/reset-password/${token} </p>
                    </div>
                    </div>
                    </div>`,
          attachments: [
            {
              filename: "logo.png",
              path: process.cwd() + "/images/logo.png",
              cid: "logo", //same cid value as in the html img src
            },
          ],
        };

        res.json({ statuscode: "201", message: "Email sent Successfully" });

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error", error);
            res.json({ statuscode: "401", message: "email not send", info });
          } else {
            console.log("info", info);
            res.json({ statuscode: "201", message: "Email sent Successfully" });
          }
        });
      }
    } else if (merchant) {
      console.log("merchant condition in forgot password", merchant);
      //  token generate for reset password
      const token = jwt.sign({ _id: merchant._id }, process.env.SECRET_KEY, {
        expiresIn: "600s",
      });

      console.log("merchant token in forgot password", token);

      if (token) {
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

        const mailOptions = {
          from: process.env.FROM_ADDRESS,
          to: email,
          subject: "Reset Your Password for Platinum Security!",
          html: `<div style="background-color: #f3f4f6;padding: 1.5rem;">
                    <div style="background-color:#fff;padding:1.5rem;">
                    <div style="border-bottom:1px solid grey">
                    <img src='cid:logo' alt='logo' style="width:150px;height:80px;"/></div>
                    <div><h3 style="color:black">Reset Password</h3>
                    <p style="color:black;line-height:1.5">A password reset event has been triggered. The password reset window is limited to 10 minutes.
                    If you do not reset your password within 10 minutes, you will need to submit a new request.
                    To complete the password reset process, visit the following link:</p>
                   <p> http://platinum-security-2031565007.us-east-1.elb.amazonaws.com/platinumsecurity/#/reset-password/${token} </p>
                    </div>
                    </div>
                    </div>`,
          attachments: [
            {
              filename: "logo.png",
              path: process.cwd() + "/images/logo.png",
              cid: "logo", //same cid value as in the html img src
            },
          ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error", error);
            res.json({ statuscode: "401", message: "email not send" });
          } else {
            console.log("info", info);
            res.json({
              statuscode: "201",
              message: "Email sent Successfully",
              token: token,
            });
          }
        });
      }
    } else {
      res.json({ statuscode: "400", message: "Sorry Email does not Exist!" });
    }
  } catch (error) {
    console.log("error", error);
    res.json({ statuscode: "500", message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (req.adminID) {
      console.log("inside admin if");
      const admin = await Admin.findOne({ _id: req.adminID._id });
      console.log("admin", admin);

      if (admin) {
        const isMatch = await bcrypt.compare(req.body.password, admin.password);

        if (isMatch) {
          res.json({
            statuscode: "401",
            message: "Don't Use Previous password ",
          });
        } else {
          admin.password = req.body.password;
          const updatedAdmin = await admin.save();
          console.log("updatedAdmin", updatedAdmin);

          res.json({
            statuscode: "201",
            message: "Password Reset Successfully",
            data: updatedAdmin,
          });
        }
      } else {
        res.json({
          statuscode: "400",
          message: "User not found",
        });
      }
    } else if (req.merchantID) {
      console.log("inside merchant if");
      const merchant = await Merchant.findOne({ _id: req.merchantID._id });
      console.log("merchant", merchant);

      if (merchant) {
        const isMatch = await bcrypt.compare(
          req.body.password,
          merchant.password
        );

        if (isMatch) {
          res.json({
            statuscode: "401",
            message: "Don't Use Previous password ",
          });
        } else {
          merchant.password = req.body.password;
          const updatedMerchant = await merchant.save();
          console.log("updatedMerchant", updatedMerchant);

          res.json({
            statuscode: "201",
            message: "Password Reset Successfully",
            data: updatedMerchant,
          });
        }
      } else {
        res.json({
          statuscode: "400",
          message: "User not found",
        });
      }
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      message: error.message,
    });
  }
};

exports.createDate = async (req, res) => {
  const { date, name } = req.body;
  const existdate = await HolidayDate.findOne({ date: date });

  if (existdate) {
    const dateList = await HolidayDate.find({});
    res.json({ statuscode: "401", message: "Already Exists", dateList });
  } else {
    const data = new HolidayDate({ date, name });
    try {
      const date = await data.save();
      if (date) {
        const dateList = await HolidayDate.find({});
        res.json({
          statuscode: "201",
          message: "Holiday Date Created Successfully",
          dateList,
        });
      }
    } catch (error) {
      res.json({ statuscode: "500", error: error.message });
    }
  }
};

exports.getDates = async (req, res) => {
  try {
    const dateList = await HolidayDate.find({});
    if (dateList.length === 0) {
      res.json({ statuscode: "400", message: "No data found" });
    } else {
      res.json({ statuscode: "201", message: "Successfully Found", dateList });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.deleteDate = async (req, res) => {
  try {
    const dateId = req.params.dateId;
    const date = await HolidayDate.findByIdAndDelete(dateId);

    if (!date) {
      res.json({ statuscode: "400", message: "Something Wrong" });
    } else {
      const dateList = await HolidayDate.find({});
      res.json({
        statuscode: "201",
        message: "Successfully Deleted",
        dateList,
      });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.addBank = async (req, res) => {
  try {
    const { bank_name, bank_address, bank_phone, contact_person } = req.body;
    console.log("contact_person", contact_person);

    const existBank = await Bank.findOne({ bank_address: bank_address });

    if (existBank) {
      const oldList = await Bank.find({}).sort({ created_at: 1 });
      res.json({ statuscode: "401", message: "Already Exists", data: oldList });
    } else {
      const data = new Bank({
        bank_name,
        bank_address,
        bank_phone,
        contact_person,
      });

      const bank = await data.save();

      if (bank) {
        const bankList = await Bank.find({}).sort({ created_at: 1 });
        res.json({
          statuscode: "201",
          message: "Bank Successfully Added",
          data: bankList,
        });
      }
    }
  } catch (error) {
    res.json({ statuscode: "400", error: error.message });
  }
};

exports.getBanks = async (req, res) => {
  try {
    const bankList = await Bank.find({}).sort({ created_at: 1 });

    if (bankList.length === 0) {
      res.json({ statuscode: "400", message: "Data Not Found" });
    } else {
      res.json({
        statuscode: "201",
        message: "Successfully Found",
        data: bankList,
      });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.getBankById = async (req, res) => {
  try {
    const bank = await Bank.findOne({ _id: req.params._id });

    if (!bank) {
      res.json({ statuscode: "400", message: "Data Not Found" });
    } else {
      res.json({
        statuscode: "201",
        message: "Successfully Found",
        data: bank,
      });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.updateBank = async (req, res) => {
  try {
    let { _id } = req.params;

    const { bank_name, bank_address, bank_phone, contact_person } = req.body;

    let obj = {
      bank_name,
      bank_address,
      bank_phone,
      contact_person,
    };

    let bank = await Bank.findByIdAndUpdate(_id, obj, {
      new: true,
    });

    if (!bank) {
      res.json({
        statuscode: "401",
        message: "Bank not exist",
      });
    } else {
      res.json({
        statuscode: "201",
        message: "Bank Successfully Updated",
        data: bank,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.deleteBank = async (req, res) => {
  try {
    const bank = await Bank.findByIdAndDelete({ _id: req.params._id });
    if (!bank) {
      res.json({ statuscode: "401", message: "Something Wrong" });
    } else {
      const banksList = await Bank.find({}).sort({ created_at: 1 });
      res.json({
        statuscode: "201",
        message: "Successfully Deleted",
        data: banksList,
      });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.assignTruck = async (req, res) => {
  try {
    let { req_ID, truckID, route } = req.body;

    const assigned = await Request.findOne({ _id: req_ID });

    if (assigned.status === "Assigned") {
      res.json({
        statuscode: "401",
        message: "Truck Already Assined this Request",
      });
    } else {
      // let result = await Promise.all(users.map(async (item) => {
      //     const results = await User.findByIdAndUpdate(item._id, {
      //         Requests: req_ID
      //     }, { new: true });
      //     return results;
      // }));

      const users = await User.find({ truck_id: truckID });
      const tokens = users
        .filter((item) => item.notifyToken)
        .map((item) => item.notifyToken);

      if (tokens.length > 0) {
        const message = {
          notification: { title: "You Got new Request", body: "Get request" },
          tokens: tokens,
        };
        const response = await admin.messaging().sendMulticast(message);
        if (response) {
          await Truck.findByIdAndUpdate(
            { _id: truckID },
            { availability_status: "Booked", $push: { Requests: req_ID } }
          );
          await Request.findByIdAndUpdate(
            req_ID,
            {
              status: "Assigned",
              truck: truckID,
              adminID: req.adminID,
              route: route,
            },
            { new: true }
          );
          const request = await Request.find({})
            .populate("truck")
            .populate("merchant")
            .populate("deposit_add_id");
          res.json({
            statuscode: "201",
            message: "Truck Assigned Successfully",
            data: request,
          });
        } else {
          res.json({
            statuscode: "400",
            message: "Truck not Assignned",
            data: response,
          });
        }
      } else {
        res.json({ statuscode: "400", message: "Users not login yet" });
      }
    }
  } catch (error) {
    console.log(error);
    res.json({ statuscode: "500", error: error });
  }
};

// exports.changeTruck = async (req, res) => {
//     try {
//         let { req_ID, truckID } = req.body;

//         //find the reqeust by id
//         const assignedRequest = await Request.findOne({ _id: req_ID })

//         //find truck by truckID
//         const truck = await Truck.findOne({ _id: truckID })
//         console.log("truck", truck);

//         //check if truck is exist or not
//         if (!truck) {
//             res.json({
//                 statuscode: '404',
//                 message: 'Truck Not Found'
//             })
//         } else {
//             //find old truck to ensure that admin is not assigning same truck again
//             const oldTruck = await Truck.findById({ _id: assignedRequest.truck });
//             console.log("oldTruck", oldTruck);

//             if (!oldTruck) {
//                 res.json({ statuscode: '404', message: "Old Truck Not Found" })
//             } else if (oldTruck._id.toString() === truckID) {
//                 const allRequests = await Request.find({}).populate('truck').populate('merchant').populate('deposit_add_id')
//                 res.json({
//                     statuscode: '400',
//                     message: "Can't Assign Same Truck Again",
//                     data: allRequests
//                 })
//             } else {
//                 //find users assigned to a new truck
//                 const users = await User.find({ truck_id: truckID });
//                 console.log("users", users);

//                 if (users.length === 0) {
//                     res.json({
//                         statuscode: '401',
//                         message: 'Officers Not Assigned to the Truck Yet'
//                     })
//                 } else {
//                     const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);

//                     if (tokens.length > 0) {
//                         const message = {
//                             notification: { title: "You Got new Request", body: "Get request", },
//                             tokens: tokens,
//                         }

//                         const response = await admin.messaging().sendMulticast(message);

//                         if (response) {
//                             oldTruck.Requests = oldTruck.Requests.filter((id) => id.toString() !== req_ID);
//                             await oldTruck.save();

//                             //checking if there was only one request in truck then it's status will change
//                             if (oldTruck.Requests.length === 0) {
//                                 await Truck.findByIdAndUpdate({ _id: oldTruck._id }, { availability_status: 'Availabale' }, { new: true })
//                             }

//                             await Truck.findByIdAndUpdate({ _id: truckID }, { availability_status: "Booked", $push: { Requests: req_ID } });
//                             await Request.findByIdAndUpdate(req_ID, { truck: truckID }, { new: true });
//                             const allRequests = await Request.find({}).populate('truck').populate('merchant').populate('deposit_add_id')

//                             res.json({
//                                 statuscode: '201',
//                                 message: 'Truck Changed Successfully',
//                                 data: allRequests
//                             })
//                         } else {
//                             res.json({
//                                 statuscode: '400',
//                                 message: 'Truck not Changed',
//                                 // data: response
//                             })
//                         }
//                     } else {
//                         res.json({
//                             statuscode: '401',
//                             message: 'Users not login yet'
//                         })
//                     }
//                 }
//             }
//         }

//     } catch (error) {
//         console.log(error);
//         res.json({ statuscode: '500', error: error.message });
//     }
// }
exports.changeTruck = async (req, res) => {
  try {
    const { req_ID, truckID } = req.body;
    console.log("req.body in change truck", req.body);

    // Find the request by ID
    const assignedRequest = await Request.findOne({ _id: req_ID });
    console.log("assignedRequest", assignedRequest);

    // Find the truck by truckID
    const truck = await Truck.findOne({ _id: truckID });
    console.log("truck", truck);


    if (!truck) {
      return res.status(404).json({ message: "Truck Not Found" });
    } else {
      //  find old truck to ensure that admin is not assigning same truck again
      const oldTruck = await Truck.findById({ _id: assignedRequest.truck });
      console.log("oldTruck", oldTruck);

      // Check if the admin is trying to assign the same truck again
      if (!oldTruck) {
        console.log("Old Truck Not Found");
        res.json({ statuscode: "404", message: "Old Truck Not Found" });
      } else if (oldTruck._id.toString() === truckID) {
        console.log("Old Truck Found");
        const allRequests = await Request.find({})
          .populate("truck")
          .populate("merchant")
          .populate("deposit_add_id");
        res.json({
          statuscode: "400",
          message: "Can't Assign Same Truck Again",
          data: allRequests,
        });
      } else {
        //find users assigned to a new truck
        const users = await User.find({ truck_id: truckID });
        console.log("users in change truck", users);

        if (users.length === 0) {
          console.log("Officers Not Assigned to the Truck Yet");
          res.json({
            statuscode: "401",
            message: "Officers Not Assigned to the Truck Yet",
          });
        } else {
          console.log("inside else");
          const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);
          console.log("tokens", tokens);
          if (tokens.length > 0) {
            const message = {
              notification: {
                title: "You Got new Request",
                body: "Get request",
              },
              tokens: tokens,
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log("response of multicast", response);
            if (response) {
              oldTruck.Requests = oldTruck.Requests.filter(
                (id) => id.toString() !== req_ID
              );
              await oldTruck.save();
              // Update the old truck: remove request ID
              await Truck.findByIdAndUpdate(assignedRequest.truck, {
                $pull: { Requests: req_ID },
              });

              // Update the new truck: push request ID
              let updateResulr = await Truck.findByIdAndUpdate(truckID, {
                $push: { Requests: req_ID },
              });
              console.log("updateResulr", updateResulr);
              // Update the request: change the truck assignment
              await Request.findByIdAndUpdate(req_ID, { truck: truckID });

              // Fetch all requests after the updates
              const allRequests = await Request.find({})
                .populate("truck")
                .populate("merchant")
                .populate("deposit_add_id");
              console.log("allRequests in success", allRequests);
              if (updateResulr) {
                res.json({
                  statuscode: "201",
                  message: "Truck Changed Successfully",
                  data: allRequests,
                });
              }
            }
          } else {
            const allRequests = await Request.find({})
              .populate("truck")
              .populate("merchant")
              .populate("deposit_add_id");
            res.json({
              statuscode: "401",
              message: "Officers Not Login Yet",
              data: allRequests
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("error in change truck", error);
    res.status(500).json({ error: error.message });
  }
};

exports.assignRoute = async (req, res) => {
  try {
    const { req_ID, route } = req.body;

    console.log("req_ID", req_ID);
    console.log("route", route);

    const existRequest = await Request.findOne({ _id: req_ID });

    if (!existRequest) {
      res.json({
        statuscode: "404",
        message: "Request Not Found",
      });
    } else {
      await Request.findByIdAndUpdate(
        { _id: req_ID },
        { route: route },
        { new: true }
      );
      const allRequests = await Request.find({})
        .populate("truck")
        .populate("merchant")
        .populate("deposit_add_id");

      res.json({
        statuscode: "201",
        message: "Route Assigned Successfully",
        data: allRequests,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: JSON.stringify(error),
      message: "Internal Server Error",
    });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params._id }).populate({
      path: "truck_id",
      populate: {
        path: "Requests",
        populate: { path: "deposit_add_id zone merchant" },
      },
    });
    console.log("user", user);

    if (user) {
      const sortedRequests = user.truck_id.Requests.sort(
        (a, b) =>
          moment(a.pickup_datetime, "YYYY-MM-DD,h:mm A").valueOf() -
          moment(b.pickup_datetime, "YYYY-MM-DD,h:mm A").valueOf()
      );

      res.json({
        statuscode: "201",
        message: "Successfully Found",
        data: sortedRequests,
      });
    } else {
      res.json({ statuscode: "400", message: "User not Found" });
    }
  } catch (error) {
    res.json({ statuscode: "500", error: error.message });
  }
};

exports.updateRequestByOfficer = async (req, res) => {
  try {
    const { req_ID, truck_id, DeclineReasons, DeclineDes, officerid } =
      req.body;
    const { io } = req;
    // Update the status of the request

    // Remove the request from the truck's requests array
    // const truck = await Truck.findOne({ _id: truck_id });
    // if (!truck) {
    //     throw new Error(`Truck with id ${truck_id} not found`);
    // }

    // const indexToRemove = truck.Requests.indexOf(req_ID);
    // if (indexToRemove !== -1) {
    //     truck.Requests.splice(indexToRemove, 1);
    // } else {
    //     console.log("ID not found in array!");
    // }

    // await truck.save();
    const request = await Request.findOne({ _id: req_ID });
    const adminID = request.adminID;

    const updateReq = await Request.findByIdAndUpdate(
      { _id: req_ID },
      {
        status: "Declined",
        DeclineReasons: DeclineReasons,
        DeclineDes: DeclineDes,
      },
      { new: true }
    );
    if (updateReq) {
      const notification = new Notification({
        message: `officer Declined Request ${DeclineDes}`,
        requester: "User",
        userid: officerid,
        adminID: adminID,
        req_ID: request.req_ID,
        role: "Admin",
      });

      const result = await notification.save();

      io.emit("poonam", result);

      res.json({
        statuscode: "201",
        message: `Request declined with ${DeclineReasons} reason`,
        data: updateReq,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "400",
      message: "Request Not Declined",
      error: error.message,
    });
  }
};

exports.saveSignature = async (req, res) => {
  try {
    const { req_ID, merchant_signature, isCaptured } = req.body;
    console.log("req.body", req.body);
    const matches = merchant_signature.match(/^data:image\/([a-z]+);base64,/);
    console.log("matches", matches);
    const type = matches[1];
    console.log("type", type);
    const base64Data = merchant_signature.replace(matches[0], "");

    const decodedImage = Buffer.from(base64Data, "base64");
    console.log("decodedImage", decodedImage);

    const imageName = "Images_pdf" + Date.now() + ".jpg";
    const imagePath = "./images/" + imageName;
    console.log("imagePath", imagePath);
    fs.writeFile(imagePath, decodedImage, (err) => {
      if (err) throw err;
      console.log("Image saved successfully");
    });

    await Request.findOneAndUpdate(
      { _id: req_ID },
      {
        merchant_signature: `${process.env.FILEPATH}` + imageName,
        isCaptured: isCaptured,
      },
      { new: true }
    );

    res.json({ statuscode: "201", message: "Image updated successfully" });
  } catch (error) {
    console.error(error);
    res.json({
      statuscode: "500",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.webToWebNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      tokens:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6IjYzY2UyMzJiN2QyOTc2NTUzZWYwODA3YyIsImlhdCI6MTY3OTM5MjE1MiwiZXhwIjoxNjc5NDc4NTUyfQ.TLFCozisUG4B_TBmP2jm-hai6ZuZASw2q2gYder5XNI",
    };
    const options = {
      // Set the TTL (time to live) to 60 seconds.
      // After that, the notification will be dropped.
      timeToLive: 60,
    };
    const response = await admin.messaging().send(payload, options);

    res.json({ statuscode: "200", message: "Notification sent successfully." });
  } catch (error) {
    console.log("Error sending message", error);
    res.json({
      statuscode: "500",
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.uploadAdminProfile = async (req, res) => {
  if (!req.file) {
    res.json({ statuscode: "500", message: "Upload fail" });
  } else {
    try {
      const { _id } = req.body;

      req.body.admin_images = `${process.env.FILEPATH}` + req.file.filename;

      let admin = await Admin.findByIdAndUpdate(_id, req.body, {
        new: true,
      });

      if (!admin) {
        res.json({
          statuscode: "401",
          message: "User Not Found",
        });
      } else {
        res.json({
          statuscode: "201",
          message: "Profile Successfully Updated",
          data: admin,
        });
      }
    } catch (error) {
      res.json({
        statuscode: "500",
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
};
