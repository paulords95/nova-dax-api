const { json } = require("express");
const express = require("express");
const fetch = require("node-fetch");
const app = express();
require("dotenv").config();

const getRequestToAPI = require("./dax-api");
const pool = require("./db-connect");
const recentPrices = require("./poolRecentPrices");

app.use(json());

setInterval(async () => {
  const result = await recentPrices("BTC");
  const sellPrice = parseFloat(result.data.ask);
  const buyPrice = parseFloat(result.data.bid);
  const avgPrice = (buyPrice + sellPrice) / 2;

  pool.query(
    `INSERT INTO "dax-api"."BTC_PRICE" (recent_prices) VALUES($1)`,
    [avgPrice.toFixed(5)],
    (error, results) => {
      if (error) {
        throw error;
      }
    }
  );
}, 350000);

setInterval(async () => {
  const result = await recentPrices("ADA");
  const sellPrice = parseFloat(result.data.ask);
  const buyPrice = parseFloat(result.data.bid);
  const avgPrice = (buyPrice + sellPrice) / 2;

  pool.query(
    `INSERT INTO "dax-api"."ADA_PRICE" (recent_prices) VALUES($1)`,
    [avgPrice.toFixed(5)],
    (error, results) => {
      if (error) {
        throw error;
      }
    }
  );
}, 35000);

setInterval(async () => {
  const result = await recentPrices("ETH");
  const sellPrice = parseFloat(result.data.ask);
  const buyPrice = parseFloat(result.data.bid);
  const avgPrice = (buyPrice + sellPrice) / 2;

  pool.query(
    `INSERT INTO "dax-api"."ETH_PRICE" (recent_prices) VALUES($1)`,
    [avgPrice.toFixed(5)],
    (error, results) => {
      if (error) {
        throw error;
      }
    }
  );
}, 35000);

setInterval(async () => {
  const result = await recentPrices("DOGE");
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
}, 35000);

app.get("/walletbalance", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");
  res.send(data);
});

const getPriceOfCurrency = async (asset) => {
  const result = [];
  let total = 0;
  for (let i of asset) {
    if (i.balance > 0 && i.currency != "BRL") {
      const apiCallResponse = await fetch(
        `https://api.novadax.com/v1/market/ticker?symbol=${i.currency}_BRL`
      );
      const priceCurrency = await apiCallResponse.json();
      if (priceCurrency.data != null) {
        const cashBalance =
          parseFloat(i.balance) * parseFloat(priceCurrency.data.ask);
        total += parseFloat(cashBalance.toFixed(2));
        result.push({
          balance: i.balance,
          price: priceCurrency.data.lastPrice,
          balanceInFiat: cashBalance.toFixed(2),
          currency: i.currency,
        });
      }
    }
  }

  const response = [];

  for (let j of result) {
    response.push({
      balance: j.balance,
      price: j.price,
      balanceInFiat: j.balanceInFiat,
      currency: j.currency,
      percentage: (
        (parseFloat(j.balanceInFiat).toFixed(1) /
          parseFloat(total).toFixed(1)) *
        100
      ).toFixed(1),
    });
  }

  response.push({
    totalAssets: total.toFixed(2),
  });
  return response;
};

app.get("/walletbalancepercentage", async (req, res) => {
  let response = "";
  try {
    const data = await getRequestToAPI(
      "/v1/account/getBalance",
      req.body.secretKey,
      req.body.accessKey
    );

    const asset = [];

    for (let i of data.data) {
      if (i.balance > 0) {
        asset.push(i);
      }
    }

    const stats = await getPriceOfCurrency(asset);
    response = stats;
  } catch (error) {
    response =
      "Chaves de API estão incorretas ou não há dados na carteira da exchange";
  }
  res.send(response);
});

app.get("/wallethistory", async (req, res) => {
  const data = await getRequestToAPI(
    "/v1/wallet/query/deposit-withdraw?currency=BTC&type=coin_in&size=10&direct=desc"
  );
  res.send(data);
});

app.get("/recentprices", async (req, res) => {
  const result = await pool.query(
    'SELECT id, recent_prices, timestamp FROM "dax-api"."BTC_PRICE" order by id desc limit 150'
  );
  res.json(result.rows);
});

app.get("/recentprices/:currency", async (req, res) => {
  const result = await pool.query(
    `SELECT id, recent_prices, timestamp FROM "dax-api"."${req.params.currency
      .toString()
      .toUpperCase()}_PRICE" order by id desc limit 150`
  );
  res.json(result.rows);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
