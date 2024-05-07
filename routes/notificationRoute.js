const express = require("express");
const Notification = require("../controller/notificationController")
const router = express.Router();

router.post("/createNotification", Notification.createNotification)
router.get("/getNotifications", Notification.getNotification)
router.delete("/delete/notification/:_id", Notification.DeleteNotification)
router.get('/getcount',Notification.getnotificationcount)
router.put('/update/:_id',Notification.UpdateNotification)
router.get("/request/:_id", Notification.getRequest)



module.exports = router;