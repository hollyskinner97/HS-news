const express = require("express");
const { getApiEndpoints } = require("./controllers/endpoints.controller");
const { getTopics } = require("./controllers/topics.controller");
const app = express();

app.use(express.json());

app.get("/api", getApiEndpoints);

app.get("/api/topics", getTopics);

// Catch-all for undefined routes
app.all("*", (req, res, next) => {
  next({ status: 404, msg: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = err.msg || "Internal server error";
  res.status(status).send({ msg });
});

module.exports = app;
