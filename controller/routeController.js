const Route = require("../model/routeModel");
const Request = require("../model/requestSchema")
const Merchant = require('../model/merchantModel')
const User = require('../model/userModel')
const Truck = require('../model/truckModel')
const mapboxSdk = require('@mapbox/mapbox-sdk');
const mapboxDirections = require('@mapbox/mapbox-sdk/services/directions');


exports.createRoute = async (req, res) => {
  try {
    const { name, description } = req.body;

    const routeName = await Route.findOne({ name });

    if (routeName) {
      res.json({ statuscode: "422", message: "Already exists" });
    } else {
      const route = await Route.create({
        name: name.toUpperCase(),
        description,
      });

      if (route) {
        res.json({
          statuscode: "201",
          message: "Route Successfully Created",
          data: route,
        });
      } else {
        res.json({
          statuscode: "400",
          message: "Invalid Route",
        });
      }
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    let routes = await Route.find({});

    if (routes.length === 0) {
      res.json({ statuscode: "401", message: "Routes not found" });
    } else {
      res.json({
        statuscode: "201",
        message: "Success",
        data: routes,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    let route = await Route.findOne({ _id: req.params._id });

    if (!route) {
      res.json({
        statuscode: "401",
        message: "Route not exist",
      });
    } else {
      res.json({
        statuscode: "201",
        message: "Route Succesfully found",
        data: route,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const _id = req.params._id;
    const { name, description } = req.body

    let route = await Route.findByIdAndUpdate(_id, { name: name.toUpperCase(), description }, {
      new: true,
    });

    if (!route) {
      res.json({
        statuscode: "400",
        message: "Route not exist",
      });
    } else {
      res.json({
        statuscode: "201",
        message: "Route Successfully Updated",
        data: route,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    let route = await Route.findByIdAndDelete(req.params._id);
    if (!route) {
      res.json({ statuscode: "400", message: "Route Not Found" });
    } else {
      let routes = await Route.find({});
      // Remove the truck id from the users collection
      const merchants = await Merchant.updateMany({ zone: req.params._id }, { $unset: { zone: 1 } });
      console.log("merchants", merchants)
      if (!merchants) {
        console.log('Error removing zone from merchants');
      }

      const officers = await User.updateMany({ zone: req.params._id }, { $unset: { zone: 1 } });
      console.log("officers", officers)
      if (!officers) {
        console.log('Error removing zone from officers');
      }

      const trucks = await Truck.updateMany({ zone: req.params._id }, { $unset: { zone: 1 } });
      console.log("trucks", trucks)
      if (!trucks) {
        console.log('Error removing zone from trucks');
      }
 
      res.json({
        statuscode: "201",
        message: "Route successfully Deleted",
        data: routes,
      });
    }
  } catch (error) {
    res.json({
      statuscode: "500",
      error: error.message,
    });
  }
};

exports.getallroutes = async (req, res) => {
  try {
    console.log("req.body", req.body)
    const client = mapboxDirections({
      accessToken: 'pk.eyJ1IjoidmFyc2hhLXRoYWt1cjE3IiwiYSI6ImNsZ3Z5bWR0ZTA4Z28za3Bsc2V2cjdqYnkifQ.AL81EnsAuFgCMNPL-wJZVw',
    });

    const request = await Request.findOne({ _id: req.body._id }).populate("pickup_add_id").populate("deposit_add_id")
    const pickup = request.pickup_add_id;
    const deposit = request.deposit_add_id;

    console.log("Pick Up", pickup)

    const origin = [pickup.lng, pickup.lat]; // Pickup coordinates
    const destination = [deposit.lng, deposit.lat]; // Deposit coordinates

    // const origin = [-1.26871, 50.87491]
    // const destination = [-2.93224, 53.39971]

    const result = await client.getDirections({
      waypoints: [
        { coordinates: origin },
        { coordinates: destination }
      ],
      profile: 'driving', // Mode of transportation
      alternatives: true, // Request multiple routes
    }).send();

    const results = result.body.routes
    console.log(results)

    const summaries = results.map(leg => leg.legs[0].summary);
    console.log("summaries", summaries)

    res.json({ statuscode: '201', message: 'Got result', result: summaries });
  } catch (error) {
    res.json({ statuscode: '500', error: error.message });
  }
};