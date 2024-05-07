const express = require("express");
const MerchantController = require("../controller/merchantController")
const router = express.Router();
const authenticate = require('../middleware/authenticate')
const upload = require('../helpers/storage')

//ADMIN DASHBOARD ROUTE
router.post("/merchant", authenticate, MerchantController.merchantRegister)
router.get("/check-username", authenticate, MerchantController.checkUserName)
router.get("/allmerchant", authenticate, MerchantController.getMerchant)
router.get("/get_merchant_byid/:_id", authenticate, MerchantController.getMerchantById)
router.put("/update_merchant/:_id", authenticate, MerchantController.updateMerchant)
router.delete("/delete_merchant/:_id", authenticate, MerchantController.deleteMerchant)
router.put('/updateActiveValue/:_id', authenticate, MerchantController.updateActiveValue)
router.get('/totalMerchant', authenticate, MerchantController.totalMerchant)
router.get('/totalcount', authenticate, MerchantController.totalCount)
router.get('/request_count_per_customer/:_id', authenticate, MerchantController.getRequestCountPerMerchant)


//MERCHANT DASHBOARD ROUTE
router.get('/allrequests/:_id', authenticate, MerchantController.getReqByMerchntId)
router.put("/updateProfile/:_id", upload.single('merchant_images'), authenticate, MerchantController.updateProfile)
router.post("/countRequest", authenticate, MerchantController.countRequest)
router.patch("/change_merchant_password", authenticate, MerchantController.changeMerchantPassword)



module.exports = router;

