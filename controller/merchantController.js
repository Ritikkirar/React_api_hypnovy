require("dotenv").config();
const Merchant = require("../model/merchantModel")
const User = require("../model/userModel")
const Truck = require('../model/truckModel')
const Request = require('../model/requestSchema')
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");


function intToString(value) {
  var newValue = value;
  if (value >= 1000) {
    var prefixes = ["", "k", "M", "B", "T", "P", "E", "Z", "Y"];
    var prefixNum = Math.floor(("" + value).length / 3);
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat((prefixNum != 0 ? (value / Math.pow(1000, prefixNum)) : value).toPrecision(precision));
      var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
      if (dotLessShortValue.length <= 2) { break; }
    }
    if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    newValue = shortValue + prefixes[prefixNum];
  }
  return newValue;
}


exports.checkUserName = async (req, res) => {
  const { username } = req.query;

  try {
    const existingUser = await Merchant.findOne({ userName: username });

    if (existingUser) {
      // Username already exists
      res.json({ isUnique: false });
    } else {
      // Username is unique
      res.json({ isUnique: true });
    }
  } catch (error) {
    console.error('Error checking username uniqueness:', error);
    res.status(500).json({ error: 'An error occurred while checking username uniqueness' });
  }
}

exports.merchantRegister = async (req, res) => {
  const { business_name, userName, type, address, city, zone, selectedOption, checkbox, maxLimit, holiday_services,
    contactPerson, email, phone, contactPerson_sec, contact_email_sec, phone_sec, password, weekly_service, 
    selected_banks,merchant_images, adminID } = req.body;
  console.log("req.body==>", req.body);
  const existMerchant = await Merchant.findOne({ "$or": [{ email: email }, { phone: phone }] });

  if (existMerchant) {
    res.json({ statuscode: '401', message: "Customer already exists" });
  } else {
    let serviceType = [];
    if (selectedOption && !checkbox) {
      serviceType.push(selectedOption);
    } else if (!selectedOption && checkbox) {
      serviceType.push(checkbox);
    } else if (selectedOption && checkbox) {
      serviceType.push(selectedOption, checkbox);
    }

    const merchant = await Merchant.create({
      business_name, userName, type, address, city, zone,
      service_type: serviceType,
      maxLimit, holiday_services,
      contactPerson, email, phone, contactPerson_sec,
      contact_email_sec, phone_sec, password, weekly_service,
      selected_banks, adminID,merchant_images    });

    if (merchant) {
      res.json({
        statuscode: '201',
        message: 'Customer Added Successfully',
      });

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
        subject: "You're Now A Member of Platinum Security!",
        html: `<div style="background-color: #f3f4f6;padding: 1.5rem;">
        <div style="background-color:#fff;padding:1.5rem;">
        <div style="border-bottom:1px solid grey"><img src='cid:logo' alt='logo' style="width:150px;height:80px;"/></div>
        <div><h3 style="color:black;font-weight:700">Your Login Credentials:</h3>
        <p style="color:black;line-height:1.5">
        <span style="font-weight:700">Email : </span>${email}
        </p>
        <p style="color:black;line-height:1.5">
        <span style="font-weight:700">Password : </span>${password}</p>
        <p> You can now login at http://platinum-security-2031565007.us-east-1.elb.amazonaws.com/platinumsecurity</p>
        </div>
        </div>
        </div>`,
        attachments: [
          {
            filename: 'logo.png',
            path: process.cwd() + '/images/logo.png',
            cid: 'logo' //same cid value as in the html img src
          }
        ]
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error", error);
          res.json({ statuscode: '400', message: "email not send" })
        } else {
          console.log("Email sent Successfully", info);
          res.json({ statuscode: '200', message: "Email sent Successfully" })
        }
      })

    } else {
      res.json({ statuscode: '500', message: "Invalid data" });
    }
  }
}

exports.getMerchant = async (req, res) => {
  try {
    let users = await Merchant.find({}).sort({ created_at: 1 })
    if (users.length === 0) {
      res.json({ statuscode: "400", message: "users not found" })
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
    });
  }
}

exports.getMerchantById = async (req, res) => {
  try {
    let merchant = await Merchant.findOne({ _id: req.params._id }).populate({ path: "zone" }).populate('selected_banks')
    console.log("merchant", merchant);
    if (!merchant) {
      res.json({
        statuscode: "400",
        message: "Merchant not exist"
      })
    } else {
      res.json({
        statuscode: "201",
        message: "Merchant Succesfully found",
        data: merchant
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message
    });
  }
}

exports.changeMerchantPassword = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.merchantID._id)
    console.log("merchant details in change pass", merchant);
    if (merchant) {
      const isMatch = await bcrypt.compare(req.body.password, merchant.password);

      if (isMatch) {
        res.json({
          statuscode: "401",
          message: "Don't Use Previous password "
        })
      } else {
        merchant.password = req.body.password;
        const updatedmerchant = await merchant.save();
        res.json({
          statuscode: "201",
          data: updatedmerchant
        });

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
          to: merchant.email,
          subject: "You have Updated Your password!",
          html: `Dear ${merchant.business_name},
          We are writing to confirm that your password has been successfully changed for your Platinum Security Website account.
          If you did not initiate this change, please contact our support team immediately at ${process.env.FROM_ADDRESS}
          Please remember the following details:
          Username/Email: ${merchant.email}
          For security reasons, we recommend that you keep your password confidential and avoid sharing it with anyone. 
          It's important to create a strong and unique password to protect your account`

        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error", error);
            res.json({ statuscode: '400', message: "email not send" })
          } else {
            console.log("Email sent Successfully", info);
            res.json({ statuscode: '200', message: "Email sent Successfully" })
          }
        })
      }
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

exports.updateMerchant = async (req, res) => {
  try {
    const { business_name, userName, type, address, city, zone, selectedOption, checkbox, maxLimit, holiday_services,
      contactPerson, email, phone, contactPerson_sec, contact_email_sec, phone_sec, password, weekly_service, selected_banks, adminID } = req.body;
    let serviceType = [];
    if (selectedOption && !checkbox) {
      serviceType.push(selectedOption);
    } else if (!selectedOption && checkbox) {
      serviceType.push(checkbox);
    } else if (selectedOption && checkbox) {
      serviceType.push(selectedOption, checkbox);
    }
    const obj = {
      business_name, userName, type, address, city, zone,
      service_type: serviceType,
      maxLimit, holiday_services,
      contactPerson, email, phone, contactPerson_sec,
      contact_email_sec, phone_sec, password, weekly_service,
      selected_banks, adminID
    }

    let merchant = await Merchant.findByIdAndUpdate(req.params._id, obj, {
      new: true
    })

    if (!merchant) {
      res.json({
        statuscode: "400",
        message: "Merchant not exist"
      })
    } else {
      res.json({
        statuscode: "201",
        message: "Merchant Successfully Updated",
        data: merchant
      })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.deleteMerchant = async (req, res) => {
  try {
    let merchant = await Merchant.findByIdAndDelete(req.params._id)
    if (!merchant) {
      res.json({ statuscode: "400", message: "Something Wrong" })
    } else {
      let users = await Merchant.find({}).sort({ created_at: 1 })
      const deleteRequest = await Request.find({ merchant: req.params._id })
      const datavalue = deleteRequest.map((item) => item._id)
      const arrval = await Truck.updateMany({ Requests: { $in: datavalue } }, { $pullAll: { Requests: datavalue } })
      const del = await Request.deleteMany({ _id: { $in: datavalue } })
      console.log("del", del);
      res.json({ statuscode: "201", message: "Merchant successfully Deleted", data: users })
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.updateActiveValue = async (req, resp) => {
  try {
    const { Active } = req.body;
    const _id = req.params._id;
    const activeData = await Merchant.findByIdAndUpdate(_id, { Active }, {
      new: true,
    });
    if (activeData) {
      let users = await Merchant.find({}).sort({ created_at: 1 })
      resp.json({
        statuscode: "201",
        message: "Updated Successfully",
        data: users
      });
    }

  } catch (error) {
    resp.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.totalMerchant = async (req, res) => {
  try {
    const merchant = await Merchant.find().count()
    const merchantCount = intToString(merchant)

    const activeMerchant = await Merchant.find({ "Active": "true" }).count()
    const activeMerchantCount = intToString(activeMerchant)

    const inactiveMerchant = await Merchant.find({ "Active": "false" }).count()
    const inactiveMerchantCount = intToString(inactiveMerchant)

    res.json({
      statuscode: "201",
      message: "Successfully found",
      data: {
        total: merchantCount,
        active: activeMerchantCount,
        in_active: inactiveMerchantCount
      }
    })

  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.totalCount = async (req, res) => {
  try {
    const bank = await Merchant.find({ "type": "FINANCIAL INSTITUTION" }).count()
    const bankCount = intToString(bank)

    const merchant = await Merchant.find({ "type": "MERCHANT" }).count()
    const merchantCount = intToString(merchant)

    const officer = await User.find().count()
    const officerCount = intToString(officer)

    const truck = await Truck.find().count()
    const truckCount = intToString(truck)

    res.json({
      statuscode: "201",
      message: "Successfully found",
      data: {
        banks: bankCount,
        merchants: merchantCount,
        officers: officerCount,
        trucks: truckCount
      }
    })

  } catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.getReqByMerchntId = async (req, res) => {
  try {
    let allrequests = await Request.find({ merchant: req.params._id }).populate('merchant').populate('truck').populate('deposit_add_id').populate('zone').populate('user').sort({ created_at: -1 })
    if (allrequests.length === 0) {
      res.json({ statuscode: '400', message: 'No requests found' })
    } else {
      res.json({ statuscode: '201', allrequests })
    }
  } catch (error) {
    res.json({ statuscode: '500', error: error })
  }
}

exports.getRequestCountPerMerchant = async (req, res) => {
  try {
    let requests = await Request.find({ merchant: req.params._id }).count()
    requests = intToString(requests)

    if (requests) {
      res.json({ statuscode: '201', message: 'Successfully found', data: requests })
    } else {
      res.json({ statuscode: '401', message: 'No Request Found', data: requests })
    }
  } catch (error) {
    res.json({ statuscode: '500', error: error })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    if (req.file) {
      req.body.merchant_images = `${process.env.FILEPATH}` + req.file.originalname;
    }
    let { _id } = req.params;
    const { business_name, address, city, contactPerson, email, phone, contactPerson_sec, contact_email_sec, phone_sec } = req.body;

    let obj = {
      business_name,
      address,
      city,
      contactPerson,
      email,
      phone,
      contactPerson_sec,
      contact_email_sec,
      phone_sec,
      merchant_images: req.body.merchant_images,
    }

    let merchant = await Merchant.findByIdAndUpdate(_id, obj, {
      new: true
    })

    if (!merchant) {
      res.json({
        statuscode: "401",
        message: "Merchant not exist"
      })
    } else {
      res.json({
        statuscode: "201",
        message: "Merchant Successfully Updated",
        data: merchant
      })
    }
  }
  catch (error) {
    res.json({
      statuscode: "500",
      error: error
    })
  }
}

exports.countRequest = async (req, res) => {
  try {
    const { start, end, id } = req.body;

    if (start === '' || end === '') {
      res.json({
        statuscode: '400',
        status: 'failure',
        message: 'Please ensure you pick two dates'
      })
    }

    const results = await Request.aggregate([
      {
        $match: {
          merchant: id,
          created_at:
          {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);

    const resultObj = {};
    results.forEach((result) => {
      resultObj[result.date] = result.count;
    });

    const startDate = new Date(start);
    const endDate = new Date(end);

    let currentDate = new Date(startDate);

    const dateArray = [];
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const count = resultObj[dateStr] || 0;
      dateArray.push({ date: dateStr, count });
      currentDate = new Date(currentDate.getTime() + 86400000);
    }

    res.json({ statuscode: "201", message: "Successfully Found", data: dateArray });

  } catch (error) {
    res.json({ statuscode: '500', error: error })
  }

}
