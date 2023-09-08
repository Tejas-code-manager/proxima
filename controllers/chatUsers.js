const { createClient } = require("@supabase/supabase-js");

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://omjzrytfflkyjpsfakhj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tanpyeXRmZmxreWpwc2Zha2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM4NTQ0MjksImV4cCI6MjAwOTQzMDQyOX0.FhD4L7nJRMbq9Vs61q_8EhblyzoKO75PcLLp3vDzLK0"
);

const fs = require("fs");
const util = require("util");
// const firebase = require("firebase");
// const { initializeApp } = require("firebase/app");
// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTHDOMAIN,
//   databaseURL: process.env.FIREBASE_DB_URL,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MSG_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID,
// };
// firebase.initializeApp(firebaseConfig);
const FCM = require("fcm-node");
const serverKey =
  "AAAAQVTxZPo:APA91bFUB2TKisdnbIyeFwd4c41k0Ef2GrpATbDFdJCk-DpjmLtzhTxzLWKVJgK044dd6Z6FuUQNbVcKe69bMep9i6-n26112dq_F45cZGbUv436JoEGA5HcmHdBBvc9FU5dqeouRY7_"; //put your server key here
const fcm = new FCM(serverKey);

const sendNotifications = async (req, res) => {
  try {
    if (!(req.description || req.title)) {
      return res.status(200).send("All input is required");
    }

    let userDetails = await User.findOne({ _id: req.user_id });
    let senderdetails = await User.findOne({ _id: req.sender_id });

    // const { data, error } = await supabase
    //   .from("users")
    //   .select()
    //   .eq(
    //     `to_id.eq.${to_id},user_id.eq.${user_id},to_id.eq.${user_id},user_id.eq.${to_id}`
    //   );

    console.log("userdetails :" + req.title);

    if (userDetails) {
      let message = {
        //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: userDetails.firebase_token,

        notification: {
          title: `${req.title}`,
          body: `${req.description}`,
        },

        data: {
          //you can send only notification or only data(or include both)
          page: `${req.page}`,
          extradata: {
            userid: senderdetails._id,
            name: senderdetails.name,
          },
        },
      };

      fcm.send(message, function (err, response) {
        if (err) {
          //   console.log("Something has gone wrong!");
          return { status: 0, message: err, data: [] };
        } else {
          //   console.log("Successfully sent with response: ", response);
          return { status: 1, message: "Notification sent", data: response };
        }
      });
    }
  } catch (err) {
    return { status: 1, message: "not send..error", data: [] };
  }
};

const getmychats = async (req, res) => {
  try {
    let { to_id, user_id } = req.body;
    const { data, error } = await supabase
      .from("chats")
      .select()
      .or(
        `to_id.eq.${to_id},user_id.eq.${user_id},to_id.eq.${user_id},user_id.eq.${to_id}`
      );

    if (data && data.length > 0) {
      return res.status(200).json({
        status: 1,
        message: "Got my chats",
        // data: getChatsall,
        data: data,
      });
    } else {
      return res.status(200).json({
        status: 3,
        message: "No conversations found",
        data: [],
      });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(200).json({
      status: 0,
      message: e.message,
      data: [],
    });
  }
};

const addChats = async (req, res) => {
  try {
    // let user_id = req.user.user_id;
    let { to_id, user_id, message, messageType } = req.body;
    let createChat = await supabase.from("chats").insert({
      to_id: to_id,
      message: message,
      user_id: user_id,
      type: messageType,
      created_at: new Date(),
    });
    if (createChat) {
      //   let senderdata = await User.findOne({ _id: user_id });
      let senderdata = await supabase.from("users").select().eq("id", user_id);
      console.log(senderdata);
      //   if (senderdata) {
      //     await sendNotifications({
      //       user_id: recevier_id,
      //       sender_id: user_id,
      //       description: `${message}`,
      //       title: `You have a new message from ${senderdata.name} 💬`,
      //       page: `CHATDETAILS`,
      //     });
      //   }

      return res.status(200).json({
        status: 1,
        message: "Chat Created",
        data: createChat,
      });
    } else {
      return res.status(200).json({
        status: 0,
        message: "Unknow Error Occured",
        data: [],
      });
    }
  } catch (e) {
    console.log(e.message);
    return res.status(200).json({
      status: 0,
      message: e.message,
      data: [],
    });
  }
};

module.exports = {
  getmychats,
  addChats,
};
