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
}, 350000);

app.get("/walletbalance", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");
  res.send(data);
});


const getPriceOfCurrency = (asset) => {
  const result = []
  for (let i of asset) {
    if (i.balance > 0) {
      fetch(`https://api.novadax.com/v1/market/ticker?symbol=${i.currency}_BRL`).then(async (response) => {
        const priceCurrency = await response.json()
        const cashBalance = parseInt(i.balance) * parseFloat(priceCurrency.data.ask)
        result.push({
          balance: i.balance,
          price: priceCurrency.data.lastPrice,
          balanceInFiat: cashBalance.toFixed(2)
        })
      
      }).catch((e) => {
        console.log(e.message)
      })
    }
  }
  console.log(result)
  return result
}


app.get("/walletbalancepercentage", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");

 res.send(await getPriceOfCurrency(data.data))
  
});

app.get("/wallethistory", async (req, res) => {
  const data = await getRequestToAPI("/v1/wallet/query/deposit-withdraw");
  res.send(data);
});

app.get("/recentprices", async (req, res) => {
  const result = await pool.query(
    'SELECT id, recent_prices, timestamp FROM "dax-api"."DOGE_PRICE" order by id desc limit 150'
  );
  res.json(result.rows);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
