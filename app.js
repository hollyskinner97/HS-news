const express = require("express");
const { getApiEndpoints } = require("./controllers/endpoints.controller");
const app = express();

app.use(express.json());

app.get("/api", getApiEndpoints);

app.use((err, req, res, next) => {
  console.log(err, "<<< This is your error");
  res.status(500).send({ error: "Internal Server Error" });
});

module.exports = app;
