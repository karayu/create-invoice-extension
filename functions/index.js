const functions = require("firebase-functions");

exports.handleDBWrite = functions.handler.database.ref.onCreate(snap => {
  console.log("Detected change!");
  return "";
});
