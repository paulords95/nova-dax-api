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

  pool.query(
    `INSERT INTO "dax-api"."DOGE_PRICE" (recent_prices) VALUES($1)`,
    [avgPrice.toFixed(5)],
    (error, results) => {
      if (error) {
        throw error;
      }
    }
  );
}, 5000);

app.get("/walletbalance", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");
  res.send(data);
});

app.get("/wallethistory", async (req, res) => {
  const data = await getRequestToAPI("/v1/wallet/query/deposit-withdraw");
  res.send(data);
});

app.get("/recentprices", async (req, res) => {
  const result = await pool.query(
    'SELECT recent_prices FROM "dax-api"."DOGE_PRICE" order by id desc limit 5'
  );
  console.log(result.rows);

  res.json(result.rows);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
