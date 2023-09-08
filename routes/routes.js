const express = require("express");
// const rateLimit = require("express-rate-limit");
const config = process.env;
const router = express.Router();

const chatUsersController = require("../controllers/chatUsers");

router.post("/addChats", chatUsersController.addChats);

// getmychats
router.post("/getmychats", chatUsersController.getmychats);

module.exports = router;
