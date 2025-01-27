const express = require("express");
const { getApiEndpoints } = require("./controllers/endpoints.controller");
const { getTopics } = require("./controllers/topics.controller");
const {
  getArticleById,
  getArticles,
} = require("./controllers/articles.controller");

const app = express();

app.use(express.json());

app.get("/api", getApiEndpoints);

app.get("/api/topics", getTopics);

app.get("/api/articles/:article_id", getArticleById);

app.get("/api/articles", getArticles);

// Catch-all for undefined routes
app.all("*", (req, res, next) => {
  next({ status: 404, msg: "Route not found" });
});

// Custom error handler for 400s
app.use((err, req, res, next) => {
  console.log(err);

  if (err.code === "22P02") {
    res.status(400).send({ error: "Bad request" });
  } else {
    next(err);
  }
});

// Custom error handler for 404s
app.use((err, req, res, next) => {
  if (err.msg === "Article not found") {
    res.status(404).send({ error: "Not found" });
  } else {
    next(err);
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = err.msg || "Internal server error";
  res.status(status).send({ msg });
});

module.exports = app;
