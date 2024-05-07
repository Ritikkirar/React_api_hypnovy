const Request = require("../model/requestSchema")
// const { base64encode, base64decode } = require('nodejs-base64');
// const Merchant = require("../model/merchantModel");
const Truck = require("../model/truckModel");
const User = require("../model/userModel");
var admin = require("firebase-admin");
// const mapboxSdk = require('@mapbox/mapbox-sdk');
// const mapboxDirections = require('@mapbox/mapbox-sdk/services/directions');



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


// exports.addRequest = async (req, res) => {
//     const { req_ID,
//         req_type,
//         charge_type,
//         pickup_datetime,
//         withreturn,
//         pickup_add_id,
//         deposit_add_id,
//         no_of_bags,
//         bags,
//         grandTotal,
//         zone,
//         phone,
//         business_name,
//         merchant,
//         signature,
//         rate,
//         extraRate,
//         customer_type
//     } = req.body

//     if (req_ID && req_ID.length === 0) {
//         res.json({ statuscode: '401', message: 'No Request Found' })
//     } else {
//         const request = new Request({
//             req_ID,
//             req_type,
//             charge_type,
//             pickup_datetime,
//             withreturn,
//             pickup_add_id,
//             deposit_add_id,
//             no_of_bags,
//             bags,
//             grandTotal,
//             zone,
//             phone,
//             business_name,
//             merchant: merchant,
//             signature,
//             rate,
//             extraRate,
//             customer_type
//         })
//         const createRequest = await request.save()

//         res.json({
//             statuscode: "201",
//             message: "Request Created Successfully",
//             data: createRequest
//         })
//     }
// } 

exports.addRequest = async (req, res) => {
    try {
        const { req_ID,
            req_type,
            charge_type,
            pickup_datetime,
            withreturn,
            pickup_address,
            deposit_add_id,
            no_of_bags,
            bags,
            grandTotal,
            zone,
            phone,
            business_name,
            merchant,
            signature,
            rate,
            extraRate,
            customer_type,
            signatory_name,
            insurance
        } = req.body
        console.log("req.body", req.body);
        let check = await Request.findOne({ req_ID: req_ID })
        if (check) {
            res.json({ statuscode: '400', message: 'Request Already Exist' })
            console.log("error", 'already exist');
        } else {
            // Find a truck that serves the customer's zone
            const truck = await Truck.findOne({ route: zone });
            console.log("truck in create request", truck);

            if (truck == null) {
                const request = new Request({
                    req_ID,
                    req_type,
                    charge_type,
                    pickup_datetime,
                    withreturn,
                    pickup_address,
                    deposit_add_id,
                    no_of_bags,
                    bags,
                    grandTotal,
                    zone,
                    phone,
                    business_name,
                    merchant: merchant,
                    signature,
                    rate,
                    extraRate,
                    customer_type,
                    truck: null,
                    status: 'Pending',
                    signatory_name,
                    insurance
                })
                const createRequest = await request.save();
                res.json({ statuscode: '200', message: 'Request Created Successfully', data: createRequest });
                return;
            }
            else {
                // Assign the request to the truck
                const request = new Request({
                    req_ID,
                    req_type,
                    charge_type,
                    pickup_datetime,
                    withreturn,
                    pickup_address,
                    deposit_add_id,
                    no_of_bags,
                    bags,
                    grandTotal,
                    zone,
                    phone,
                    business_name,
                    merchant: merchant,
                    signature,
                    rate,
                    extraRate,
                    customer_type,
                    truck: truck._id,
                    status: 'Assigned',
                    signatory_name,
                    insurance
                })

                const createRequest = await request.save();
                const currentDate = new Date();
                // Update the truck's availability status and assigned requests
                // await Truck.findByIdAndUpdate({ _id: truck._id }, { availability_status: "Booked", updated_At: currentDate, $push: { Requests: request._id } }, { new: true });
                await Truck.findByIdAndUpdate(
                    { _id: truck._id },
                    {
                        $set: {
                            availability_status: "Booked",
                            updated_at: currentDate
                        },
                        $push: { Requests: request._id }
                    },
                    { new: true }
                );

                // Send notifications to the truck drivers
                const users = await User.find({ truck_id: truck._id });
                if (!users.length > 0) {
                    res.json({ statuscode: '202', message: 'Users not assign  yet' })
                } else {
                    console.log("users", users);
                    const tokens = users.filter((item) => item.notifyToken).map((item) => item.notifyToken);
                    console.log("token", tokens)
                    if (!tokens.length > 0) {

                        console.log("Users not login yet");
                        res.json({
                            statuscode: '203', message: "Request Created Successfully",
                            data: createRequest
                        })


                    } else {
                        const message = {
                            notification: { title: "You Got new Request", body: "Get request", },
                            tokens: tokens,
                        }
                        const response = await admin.messaging().sendMulticast(message);
                        console.log("response", response);
                        if (!response) {

                        } else {
                            res.json({
                                statuscode: "201",
                                message: "Request Created Successfully",
                                data: createRequest
                            })
                        }

                    }
                }
            }
        }
    } catch (error) {
        res.json({
            statuscode: '500',
            error: JSON.stringify(error),
            message: 'Internal Server Error'
        })
    }
}

exports.getAllRequest = async (req, res) => {
    try {
        let allrequest = await Request.find({}).populate('truck').populate('merchant').populate('deposit_add_id').populate('zone').populate('user').sort({ created_at: -1 })

        if (allrequest.length === 0) {
            res.json({ statuscode: '400', message: 'No data found' })
        } else {
            res.json({ statuscode: '201', data: allrequest })
        }
    } catch (error) {
        res.json({ statuscode: '500', error: error })
    }
}

exports.getRequestByReqId = async (req, res) => {
    try {
        let request = await Request.findById(req.params._id).populate('deposit_add_id').populate('merchant', 'merchant_images').populate('truck').populate('zone')
        // console.log("request", request.truck);

        const users = await User.find({ truck_id: request.truck })
        // console.log("users", users);

        if (!request) {
            res.json({ statuscode: "400", message: "Somthing Wrong" })
        } else {
            res.json({ statuscode: "201", request, users, message: "Request get by Id" })
        }
    } catch (error) {
        res.json({ statuscode: "500", error: error })
    }
}

exports.deleteRequestById = async (req, res) => {
    try {
        let request = await Request.findByIdAndDelete(req.params._id)

        if (!request) {
            res.json({ statuscode: "400", message: "Request Not Found" })
        } else {
            res.json({ statuscode: "201", message: "Request Successfully Deleted" })
        }
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.editRequestById = async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate({ _id: req.params._id }, req.body, { new: true })
        if (!request) {
            res.json({ statuscode: "400", message: "Request not found" })
        } else {
            res.json({ statuscode: "201", message: "Request update successfully", data: request })
        }
    } catch (error) {
        res.json({ statuscode: "500", message: error })
    }
}

exports.totalRequestCount = async (req, res) => {
    try {
        const requests = await Request.find().count()
        const requestsCount = intToString(requests)

        const inTransitRequests = await Request.find({ "status": "In transit" }).count()
        const inTransitRequestsCount = intToString(inTransitRequests)

        const completedRequests = await Request.find({ "status": "Completed" }).count()
        const completedRequestsCount = intToString(completedRequests)

        const assignedRequests = await Request.find({ "status": "Assigned" }).count()
        const assignedRequestsCount = intToString(assignedRequests)

        res.json({
            statuscode: "201",
            message: "Successfully found",
            data: {
                totalRequests: requestsCount,
                completedReq: completedRequestsCount,
                assignedReq: assignedRequestsCount,
                inTransitReq: inTransitRequestsCount
            }
        })
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.assignedRequests = async (req, res) => {
    try {
        const assignedRequests = await Request.find({ "status": "Assigned" })

        let merchantCount = 0;
        let bankCount = 0;
        let normalCount = 0;
        let premiumCount = 0;

        for (const request of assignedRequests) {
            if (request.customer_type === "MERCHANT") {
                merchantCount++;
            }
            if (request.customer_type === "FINANCIAL INSTITUTION") {
                bankCount++;
            }
            if (request.charge_type === "Normal") {
                normalCount++;
            }
            if (request.charge_type === "Premium") {
                premiumCount++;
            }
        }
        const totalCountReq = intToString(assignedRequests.length)
        const merchantCountReq = intToString(merchantCount)
        const bankCountReq = intToString(bankCount)
        const normalCountReq = intToString(normalCount)
        const premiumCountReq = intToString(premiumCount)


        res.json({
            statuscode: '201',
            message: 'Requests Successfully Found',
            data: {
                total: totalCountReq,
                merchant: merchantCountReq,
                bank: bankCountReq,
                normal: normalCountReq,
                premium: premiumCountReq
            }
        })
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.inTransitRequests = async (req, res) => {
    try {
        const inTransitRequests = await Request.find({ "status": "In transit" })

        let merchantCount = 0;
        let bankCount = 0;
        let normalCount = 0;
        let premiumCount = 0;
        for (const request of inTransitRequests) {
            if (request.customer_type === "MERCHANT") {
                merchantCount++;
            }
            if (request.customer_type === "FINANCIAL INSTITUTION") {
                bankCount++;
            }
            if (request.charge_type === "Normal") {
                normalCount++;
            }
            if (request.charge_type === "Premium") {
                premiumCount++;
            }
        }
        res.json({
            statuscode: '201',
            message: 'Requests Successfully Found',
            data: {
                total: inTransitRequests.length,
                merchant: merchantCount,
                bank: bankCount,
                normal: normalCount,
                premium: premiumCount
            }
        })

    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.merchantTypeWiseRequest = async (req, res) => {
    try {
        const merchantReq = await Request.find({ "customer_type": "MERCHANT" }).count()
        const bankReq = await Request.find({ "customer_type": "FINANCIAL INSTITUTION" }).count()

        const merchantReqCount = intToString(merchantReq)
        const bankReqCount = intToString(bankReq)

        res.json({
            statuscode: '201',
            message: "Sucessfully found",
            data: {
                merchantReq: merchantReqCount,
                bankReq: bankReqCount
            }
        })

    } catch (error) {
        res.json({ statuscode: '500', error: error, message: 'Nothing found' })
    }
}

exports.totalMerchantRequestCount = async (req, res) => {
    try {
        const requests = await Request.find({ merchant: req.params._id })
        const requestsCount = intToString(requests.length)

        const inTransitRequests = requests.filter((data) => data.status === "In Transit")
        const inTransitRequestsCount = intToString(inTransitRequests.length)

        const completedRequests = requests.filter((data) => data.status === "Completed")
        const completedRequestsCount = intToString(completedRequests.length)

        const assignedRequests = requests.filter((data) => data.status === "Assigned")
        const assignedRequestsCount = intToString(assignedRequests.length)

        res.json({
            statuscode: "201",
            message: "Successfully found",
            data: {
                totalRequests: requestsCount,
                completedReq: completedRequestsCount,
                assignedReq: assignedRequestsCount,
                inTransitReq: inTransitRequestsCount
            }
        })

    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}
