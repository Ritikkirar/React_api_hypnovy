const Truck = require("../model/truckModel");
const User = require("../model/userModel");
require("dotenv").config();


exports.addTruck = async (req, res) => {
    if (!req.files) {
        res.json({ statuscode: "500", message: 'Upload fail' });
    } else {
        try {
            const { truck_name, truck_no, truck_type, truck_insurance_amount, route } = req.body

            if (req.files.truck_image) {
                req.body.truck_image = `${process.env.FILEPATH}` + req.files['truck_image'][0].originalname;
            }
            if (req.files.truck_document) {
                req.body.truck_document = `${process.env.FILEPATH}` + req.files['truck_document'][0].originalname;
            }

            const existTruck = await Truck.findOne({ truck_no })

            if (existTruck) {
                const truckList = await Truck.find({}).populate('route').sort({ created_at: 1 })
                res.json({
                    statuscode: "401",
                    message: "Already Exists",
                    data: truckList
                })
            } else {
                const truck = await Truck.create({
                    truck_name,
                    truck_no,
                    truck_type,
                    truck_insurance_amount,
                    route,
                    truck_image: req.body.truck_image,
                    truck_document: req.body.truck_document
                });

                if (truck) {
                    const truckList = await Truck.find({}).populate('route').sort({ created_at: 1 })
                    res.json({
                        statuscode: '201',
                        message: "Truck Added Successfully",
                        data: truckList
                    });
                } else {
                    res.json({
                        statuscode: "400",
                        message: "Invalid Data"
                    })
                }
            }
        } catch (error) {
            res.json({
                statuscode: "500",
                error: "Internal Server Error"
            })
        }
    }

}

// assign truck list
exports.getAllTrucks = async (req, res) => {
    try {
        let trucks = await Truck.aggregate(
            [{
                $lookup: {
                    from: "requests",
                    localField: "Requests",
                    foreignField: "_id",
                    as: "Requests"
                }
            },
            {
                $addFields: {
                    requestTotal: {
                        $sum: { $ifNull: ["$Requests.grandTotal", []] }
                    }
                }
            },
            {
                $lookup: {
                    from: "routes",
                    localField: "route", // Update with the actual field name in the Truck model that references the Route
                    foreignField: "_id",
                    as: "route"
                }
            },
            {
                $unwind: "$route"
            }
            ])
        console.log("trucks list in get all trucks", trucks);

        if (trucks.length === 0) {
            res.json({ statuscode: "401", message: "trucks not found" })
        } else {
            res.json({
                statuscode: "201",
                message: "Success",
                data: trucks
            })
        }
    } catch (error) {
        console.log("error", error);
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

//Recent Assign Truck 
exports.RecentAssignTruck = async (req, res) => {
    try {
        let trucks = await Truck.aggregate([
            {
                $match: {
                    availability_status: "Booked"
                }
            },
            {
                $lookup: {
                    from: "requests",
                    localField: "Requests",
                    foreignField: "_id",
                    as: "Requests"
                }
            },
            {
                $addFields: {
                    requestTotal: {
                        $sum: { $ifNull: ["$Requests.grandTotal", []] }
                    }
                }
            },
            {
                $lookup: {
                    from: "routes",
                    localField: "route", // Update with the actual field name in the Truck model that references the Route
                    foreignField: "_id",
                    as: "route"
                }
            },
            {
                $unwind: "$route"
            },
            {
                $sort: {
                    updated_at: -1 // Sort in descending order based on requestTotal
                }
            }
        ]);
        console.log("trucks?????", trucks);
        if (trucks) {
            res.json({
                statuscode: "201",
                message: "Success",
                data: trucks
            })
        } else {
            res.json({
                statuscode: "401",
                message: "Got an error",

            })
        }
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }

}

//all truck list
exports.truckAllList = async (req, res) => {
    try {
        let trucks = await Truck.find({}).populate('route').sort({ created_at: 1 })
        console.log("trucks?????", trucks);
        if (trucks) {
            res.json({
                statuscode: "201",
                message: "Success",
                data: trucks
            })
        } else {
            res.json({
                statuscode: "401",
                message: "Got an error",

            })
        }
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }

}

exports.getTruckById = async (req, res) => {
    try {
        let truck = await Truck.findOne({ _id: req.params._id }).populate({ path: "Requests", populate: [{ path: "deposit_add_id" }] }).populate({ path: 'route' });
        let truckuser = await User.find({ truck_id: req.params._id })

        if (!truck) {
            res.json({
                statuscode: "401",
                message: "Truck not exist"
            })
        } else {
            res.json({
                statuscode: "201",
                message: "Truck Succesfully found",
                data: {
                    truck: truck,
                    user: truckuser
                }
            })
        }
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.updateTruck = async (req, res) => {
    if (!req.files) {
        res.json({ statuscode: "500", message: 'Upload fail' });
    } else {
        try {
            let { _id } = req.params;

            const { truck_name, truck_no, truck_type, truck_insurance_amount, route } = req.body

            if (req.files.truck_image) {
                req.body.truck_image = `${process.env.FILEPATH}` + req.files['truck_image'][0].originalname;
            }
            if (req.files.truck_document) {
                req.body.truck_document = `${process.env.FILEPATH}` + req.files['truck_document'][0].originalname;
            }

            let obj = {
                truck_name,
                truck_no,
                truck_type,
                truck_insurance_amount,
                route,
                truck_image: req.body.truck_image,
                truck_document: req.body.truck_document
            }

            let truck = await Truck.findByIdAndUpdate(_id, obj, {
                new: true
            })

            if (!truck) {
                res.json({
                    statuscode: "401",
                    message: "Truck not exist"
                })
            } else {
                res.json({
                    statuscode: "201",
                    message: "Truck Successfully Updated",
                    data: truck
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
}

exports.deleteTruck = async (req, res) => {
    try {
        let truck = await Truck.findByIdAndDelete({ _id: req.params._id })

        if (!truck) {
            res.json({ statuscode: "401", message: "Something Wrong" })
        } else {
            let trucks = await Truck.find({}).populate('route').sort({ created_at: 1 })
            // Remove the truck id from the users collection
            const users = await User.updateMany({ truck_id: req.params._id }, { $unset: { truck_id: 1 } });
            console.log("users", users)
            if (!users) {
                console.log('Error removing truck id from users');
            }

            res.json({
                statuscode: "201",
                message: "Truck successfully Deleted",
                data: trucks
            })
        }
    } catch (error) {
        console.log("error", error);
        res.json({
            statuscode: "500",
            error: error.message
        })
    }
}

exports.getUserByTruck = async (req, res) => {
    try {
        let { truckName } = req.body
        let users = await User.find({ truck_id: truckName })
        console.log("users", users);
        if (users.length === 0) {
            res.json({ statuscode: "401", message: "No Users found" })
        } else {
            res.json({ statuscode: "201", message: "Successfully Found", data: users })
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
        const activeData = await Truck.findByIdAndUpdate(_id, { Active }, {
            new: true,
        });
        if (activeData) {
            let trucks = await Truck.find({}).populate('route').sort({ created_at: 1 })
            res.json({
                statuscode: "201",
                data: trucks
            });
        }

    } catch (error) {
        res.json({
            statuscode: "500",
            error: error
        })
    }
}

exports.getTruckByZone = async (req, res) => {
    try {
        const { zone } = req.body;
        const trucks = await Truck.find({ route: zone })

        if (trucks.length === 0) {
            res.json({
                statuscode: '404',
                message: "No Trucks Found"
            })
        } else {
            res.json({
                statuscode: '201',
                message: 'Trucks Found Successfully',
                data: trucks
            })
        }
    } catch (error) {
        res.json({
            statuscode: "500",
            error: error.message
        })
    }
}
