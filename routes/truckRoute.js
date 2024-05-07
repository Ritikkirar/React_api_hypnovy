const express = require("express");
const upload = require('../helpers/storage')
const TruckController = require("../controller/truckController")
const router = express.Router();
const authenticate = require("../middleware/authenticate")

router.post('/addtruck', upload.fields([
    {
        name: 'truck_image',
        maxCount: 1
    },
    {
        name: 'truck_document',
        maxCount: 1
    }
]), authenticate, TruckController.addTruck)
router.get('/recentAssignTruck', authenticate, TruckController.RecentAssignTruck)
router.get('/trucks', authenticate, TruckController.getAllTrucks) //recent assignee trucks list
router.get('/trucklist', authenticate, TruckController.truckAllList)  //list of all trucks
router.get('/truckbyid/:_id', authenticate, TruckController.getTruckById)
router.put("/updatetruck/:_id", upload.fields([
    {
        name: 'truck_image',
        maxCount: 1
    },
    {
        name: 'truck_document',
        maxCount: 1
    }
]), authenticate, TruckController.updateTruck)
router.delete('/deletetruck/:_id', authenticate, TruckController.deleteTruck)
router.post('/get_user_by_truck', authenticate, TruckController.getUserByTruck)
router.put('/updateActiveValue/:_id', authenticate, TruckController.updateActiveValue)
router.post('/gettruckbyzone', authenticate, TruckController.getTruckByZone)

module.exports = router;