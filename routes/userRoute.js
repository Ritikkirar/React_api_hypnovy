const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authenticate = require("../middleware/authenticate");
const Admin = require("../controller/adminController")
const upload = require('../helpers/storage')

router.post("/user", upload.fields([
    {
        name: 'officerImage',
        maxCount: 1
    },
    {
        name: 'signatureFile',
        maxCount: 1
    }
]), authenticate, userController.register)
router.post("/login", userController.login)
router.patch("/changepassword", authenticate, userController.changeUserPassword)
router.get("/user", authenticate, userController.getUsers)
router.get("/user/:_id", authenticate, userController.getUserById)
router.put("/user", upload.single('officerImage'), authenticate, userController.updateUser)
router.delete("/user/:_id", authenticate, userController.deleteUser)
router.put('/updateActiveValue/:_id', authenticate, userController.updateActiveValue);

router.get("/getrequest/:_id",  Admin.getRequest)

router.post("/sendNotification", userController.sendNotification)
router.post("/changestatus", authenticate, userController.changeStatus)
router.post("/barcodestatus", authenticate, userController.changeBarcodeStatus)

router.post("/declinerequest", authenticate, Admin.updateRequestByOfficer)
router.post("/savesign", authenticate, Admin.saveSignature)



module.exports = router;