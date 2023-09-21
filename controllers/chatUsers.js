const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const admin = require("firebase-admin");
const path = require("path");
// Create a single supabase client for interacting with your database
const jsonCredPath = path.join(
  __dirname,
  "proxima-35839-firebase-adminsdk-jpc6h-448dc0bd30.json"
);

const serviceAccount = require(`${jsonCredPath}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Other options if needed
});
const supabase = createClient(
  "https://omjzrytfflkyjpsfakhj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tanpyeXRmZmxreWpwc2Zha2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM4NTQ0MjksImV4cCI6MjAwOTQzMDQyOX0.FhD4L7nJRMbq9Vs61q_8EhblyzoKO75PcLLp3vDzLK0"
);

// D:\chatApp\proxima-35839-firebase-adminsdk-jpc6h-448dc0bd30.json

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
const serverKey = "20765c7abadf3d90c398bfca099649a3e7215c7a"; //put your server key here
const fcm = new FCM(serverKey);

const sendNotifications = async (req, res) => {
  try {
    if (!(req.description || req.title)) {
      return res.status(200).send("All input is required");
    }

    // let userDetails = await User.findOne({ _id: req.user_id });
    // let senderdetails = await User.findOne({ _id: req.sender_id });

    let userDetails = await supabase
      .from("users")
      .select()
      .eq("id", req.user_id);

    let senderdetails = await supabase
      .from("users")
      .select()
      .eq("id", req.sender_id);

    console.log("senderdetails ===> ", req.page);

    const registrationToken = userDetails["data"][0]["firebase_token"];

    const message = {
      notification: {
        title: req.title,
        body: req.description,
      },
      data: {
        //you can send only notification or only data(or include both)
        page: `${req.page}`,
        // extradata: {
        //   userid: `${userDetails["data"][0]["id"]}`,
        //   name: `${senderdetails["data"][0]["name"]}`,
        //   to_id: `${senderdetails["data"][0]["id"]}`,
        //   key1: "value1",
        // },
        extradata: JSON.stringify({
          userid: userDetails["data"][0]["id"],
          name: senderdetails["data"][0]["name"],
          to_id: senderdetails["data"][0]["id"],
          key1: "value1",
        }),
      },
      token: registrationToken,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });

    // if (userDetails) {
    //   let message = {
    //     //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //     to: userDetails?.data[0]?.firebase_token,

    //     notification: {
    //       title: `${req.title}`,
    //       body: `${req.description}`,
    //     },

    //     data: {
    //       //you can send only notification or only data(or include both)
    //       page: `${req.page}`,
    //       extradata: {
    //         userid: senderdetails?.data[0]?.id,
    //         name: senderdetails?.data[0]?.name,
    //       },
    //     },
    //   };
    // }
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
      //   .or(`to_id.eq.${to_id},user_id.eq.${user_id}`)
      //   .or(`to_id.eq.${user_id},user_id.eq.${to_id}`);
      .filter("to_id", "in", `(${to_id},${user_id})`)
      .filter("user_id", "in", `(${user_id},${to_id})`);

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
      // console.log(senderdata?.data[0]);
      if (senderdata) {
        await sendNotifications({
          user_id: to_id,
          sender_id: user_id,
          description: `${message}`,
          // page: "CHATDETAILS",
          title: `You have a new message from ${senderdata?.data[0]?.name} 💬`,
          page: `CHATDETAILS`,
        });
      }

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
