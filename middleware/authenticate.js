const jwt = require('jsonwebtoken')
const User = require('../model/userModel')
const Admin = require('../model/adminModel')
const Merchant = require('../model/merchantModel')

const authenticate = async (req, res, next) => {
    if (req.headers.authorizationkey === `${process.env.API_KEY}`) {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                console.log("token ////",token );

                const verifyToken = jwt.verify(token, `${process.env.SECRET_KEY}`);
                console.log("tverifyToken ????",verifyToken );

                const rootUser = await User.findOne({ _id: verifyToken._id})
                const admin = await Admin.findOne({ _id: verifyToken._id,  })
                const merchant = await Merchant.findOne({ _id: verifyToken._id,  })

                if (rootUser) {
                    req.token = token;
                    req.rootUser = rootUser;
                    req.userID = rootUser._id;
                } else if (admin) {
                    req.token = token;
                    req.admin = admin;
                    req.adminID = admin._id;
                } else if (merchant) {
                    req.token = token;
                    req.merchant = merchant;
                    req.merchantID = merchant._id;
                } else {
                    res.json({
                        statuscode: "400",
                        message: "No user found"
                    })
                }
                next();
            }
            catch (err) {
                res.json({ statuscode: '402', error: "Unauthorized : No token provided or token is expired" });
                console.log(err);
            }
        } else {
            res.json({
                statuscode: "401",
                message: "No token provided"
            })
        }
    } else {
        res.json({
            statuscode: "301",
            message: "API key is required"
        })
    }
}

module.exports = authenticate;