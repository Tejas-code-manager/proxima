const express = require("express");
// const rateLimit = require("express-rate-limit");
const config = process.env;
const router = express.Router();

const chatUsersController = require("../controllers/chatUsers");

router.post("/addChats", chatUsersController.addChats);

// getmychats
router.post("/getmychats", chatUsersController.getmychats);

//remove profile pic
router.post("/removeprofilepic", chatUsersController.removeProfilePic);

module.exports = router;
