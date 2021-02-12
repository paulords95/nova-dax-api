const { json } = require("express");
const express = require("express");
const app = express();
require("dotenv").config();

const getRequestToAPI = require("./dax-api");
const pool = require("./dbConnect");
const recentPrices = require("./poolRecentPrices");

app.use(json());

setInterval(async () => {
  const result = await recentPrices();
  const sellPrice = parseFloat(result.data.ask);
  const buyPrice = parseFloat(result.data.bid);
  const avgPrice = (buyPrice + sellPrice) / 2;
  console.log(avgPrice.toFixed(5));
}, 3000);

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

//try {
//  const allData = await pool.query("SELECT * FROM brstats.people_data");
//
//  res.json(allData.rows);
//} catch (error) {
//  console.error(error.message);
//}
