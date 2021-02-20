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
    [parseInt(avgPrice)],
    (error, results) => {
      if (error) {
        throw error;
      }
    }
  );
}, 30000);

app.get("/walletbalance", async (req, res) => {
  const data = await getRequestToAPI("/v1/account/getBalance");
  res.send(data);
});


const getPriceOfCurrency = async (asset) => {
  const result = []
  let total = 0
  for (let i of asset) {
    if (i.balance > 0 && i.currency != "BRL") {
      const apiCallResponse = await fetch(`https://api.novadax.com/v1/market/ticker?symbol=${i.currency}_BRL`)
      const priceCurrency = await apiCallResponse.json()
      if (priceCurrency.data != null) {
        const cashBalance = parseFloat(i.balance) * parseFloat(priceCurrency.data.ask)
        total += parseFloat(cashBalance.toFixed(2))
        result.push({
          balance: i.balance,
          price: priceCurrency.data.lastPrice,
          balanceInFiat: cashBalance.toFixed(2),
          currency: i.currency,
        })
        
      }
      
    }
  }

  const response = []

  for (let j of result) {
    response.push({
      balance: j.balance,
      price:j.price,
      balanceInFiat: j.balanceInFiat,
      currency: j.currency,
      percentage: (parseFloat(j.balanceInFiat).toFixed(1) / parseFloat(total).toFixed(1) * 100).toFixed(1)
    })
  }

  response.push( {
    totalAssets: total.toFixed(2)
  })
  return (response)
}

app.get("/walletbalancepercentage", async (req, res) => {
 try {
  const data = await getRequestToAPI("/v1/account/getBalance");
  const stats = await getPriceOfCurrency(data.data)
  res.send(stats)
 } catch (error) {
   console.log(error)
 }
});

app.get("/wallethistory", async (req, res) => {
  const data = await getRequestToAPI("/v1/wallet/query/deposit-withdraw");
  res.send(data);
});

app.get("/recentprices", async (req, res) => {
  const result = await pool.query(
    'SELECT id, recent_prices, timestamp FROM "dax-api"."DOGE_PRICE" order by id desc limit 340'
  );
  const response = []
  for (let i of result.rows) {
    response.push({
      id: i.id,
      recent_prices: parseInt(i.recent_prices),
      timestamp: i.timestamp
    })
  }
  res.json(response);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
