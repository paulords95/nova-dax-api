const fetch = require("node-fetch");
const express = require("express");
const app = express();

const poolRecentPrices = (currency) => {
  return new Promise((resolve, reject) => {
    fetch(`https://api.novadax.com/v1/market/ticker?symbol=${currency}_BRL`, {
      method: "GET",
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

module.exports = poolRecentPrices;
