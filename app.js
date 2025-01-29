const express = require("express");
const apiRouter = require("./routers/api-router");

const app = express();

app.use(express.json());
app.use("/api", apiRouter);

// Catch-all for undefined routes
app.all("*", (req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// Custom error handler for known errors
app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({ error: err.msg });
  } else {
    next(err);
  }
});

// Error handler for 400s
app.use((err, req, res, next) => {
  if (err.code === "22P02" || err.code === "23502") {
    res.status(400).send({ error: "Bad request" });
  } else {
    next(err);
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.log(err, "<<< Unhandled error");
  res.status(500).send({ error: "Internal Server Error" });
});

module.exports = app;
