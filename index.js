const { json } = require("express");
const express = require("express");
const app = express();
require("dotenv").config();

const getRequestToAPI = require("./dax-api");

app.use(json());

app.get("/walletbalance", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");
  res.send(data);
});

app.get("/wallethistory", async (req, res) => {
  const data = await getRequestToAPI("/v1/wallet/query/deposit-withdraw");
  res.send(data);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
