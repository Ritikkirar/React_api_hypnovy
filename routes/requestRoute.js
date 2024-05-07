const express = require("express");
const Request = require("../controller/requestController")
const upload = require('../helpers/storage')
const router = express.Router();
const authenticate = require('../middleware/authenticate')


router.post("/addrequest", upload.any(), authenticate, Request.addRequest)
router.get("/allrequest",authenticate,  Request.getAllRequest)
router.delete("/delete/:_id", authenticate, Request.deleteRequestById)
router.get("/singlerequest/:_id",authenticate, Request.getRequestByReqId)
router.put("/editrequest/:_id", authenticate, Request.editRequestById)


router.get("/get_all_requests_count", authenticate, Request.totalRequestCount)
router.get("/get_assigned_req", authenticate, Request.assignedRequests)
router.get("/get_transit_req", authenticate, Request.inTransitRequests)
router.get("/get_typewise_req", authenticate, Request.merchantTypeWiseRequest)
router.get("/allMerchantRequest/:_id",authenticate, Request.totalMerchantRequestCount)

module.exports = router;