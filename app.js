const express = require("express");
const { getApiEndpoints } = require("./controllers/endpoints.controller");
const { getTopics } = require("./controllers/topics.controller");
const {
  getArticleById,
  getArticles,
  patchArticle,
} = require("./controllers/articles.controller");
const {
  getCommentsByArticleId,
  postComment,
  deleteCommentById,
} = require("./controllers/comments.controller");
const { getUsers } = require("./controllers/users.controller");

const app = express();

app.use(express.json());

app.get("/api", getApiEndpoints);

app.get("/api/topics", getTopics);

app.get("/api/articles/:article_id", getArticleById);

app.get("/api/articles", getArticles);

app.get("/api/articles/:article_id/comments", getCommentsByArticleId);

app.post("/api/articles/:article_id/comments", postComment);

app.patch("/api/articles/:article_id", patchArticle);

app.delete("/api/comments/:comment_id", deleteCommentById);

app.get("/api/users", getUsers);

// Catch-all for undefined routes
app.all("*", (req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// Custom error handler
app.use((err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({ error: err.msg });
  } else {
    next(err);
  }
});

// Custom error handler for 400s
app.use((err, req, res, next) => {
  if (err.code === "22P02" || err.code === "23502") {
    res.status(400).send({ error: "Bad request" });
  } else {
    next(err);
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.log(err, "<<< Need to handle this");
  res.status(500).send({ error: "Internal Server Error" });
});

module.exports = app;
