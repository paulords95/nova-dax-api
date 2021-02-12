const fetch = require("node-fetch");
const crypto = require("crypto");
require("dotenv").config();

const getRequestToAPI = (route) => {
  return new Promise((resolve, reject) => {
    const timeStamp = Date.now();
    const stringTobeEncoded = `GET\n${route}\n\n${timeStamp.toString()}`;
    const hash = crypto
      .createHmac("SHA256", process.env.SECRETKEY)
      .update(stringTobeEncoded.toString())
      .digest("hex");

    fetch("https://api.novadax.com" + route, {
      method: "GET",
      headers: {
        "X-Nova-Access-Key": process.env.ACCESSKEY,
        "X-Nova-Signature": hash,
        "X-Nova-Timestamp": timeStamp,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        resolve(json);
      })
      .catch((e) => {
        reject(e);
      });
  });
};

module.exports = getRequestToAPI;
