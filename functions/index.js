const functions = require("firebase-functions");

exports.handleDBWrite = functions.database.ref("/invoices").onCreate(snap => {
  console.log("Detected change!");
  return "";
});
