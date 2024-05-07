const express = require("express");
const upload = require('../helpers/storage')
const Admin = require("../controller/adminController")
const Route = require("../controller/routeController")
const router = express.Router();
const authenticate = require('../middleware/authenticate')

router.post("/adminregister", Admin.adminRegister)
router.put("/update/admin_profile", upload.single("admin_images"), Admin.uploadAdminProfile)
router.get('/admindetails/:_id',Admin.getAdminDetails)
router.post("/adminlogin", Admin.adminLogin)
router.post("/forgotpassword", Admin.forgotpassword)
router.delete("/delete_admin/:_id", Admin.adminDelete)
router.patch("/change_password", authenticate, Admin.changePassword)

router.post("/addholidaydate", authenticate, Admin.createDate)
router.get("/getholidaydate", authenticate, Admin.getDates)
router.delete("/deleteholidaydate/:dateId", authenticate, Admin.deleteDate)

router.post("/addbank", authenticate, Admin.addBank)
router.get("/banks", authenticate, Admin.getBanks)
router.get('/bank/:_id', authenticate, Admin.getBankById)
router.put('/bank/:_id', authenticate, Admin.updateBank)
router.delete("/bank/:_id", authenticate, Admin.deleteBank)

router.post("/add", authenticate, Route.createRoute);
router.get("/get-all", authenticate, Route.getRoutes);
router.get("/routebyid/:_id", authenticate, Route.getRouteById);
router.put("/updateRoute/:_id", authenticate, Route.updateRoute);
router.delete("/deleteRoute/:_id", authenticate, Route.deleteRoute);
router.post("/allroutes",authenticate, Route.getallroutes)

router.post("/changetruck", authenticate, Admin.changeTruck)
router.post("/assigntruck", authenticate, Admin.assignTruck)
router.post("/assignroute", authenticate, Admin.assignRoute)


router.post("/webtoweb", Admin.webToWebNotification)






module.exports = router;