const db = require("../db/connection");
const { checkTopicExists } = require("./utils");

exports.selectArticleById = (article_id) => {
  return db
    .query("SELECT * FROM articles WHERE article_id=$1", [article_id])
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Article not found" });
      } else {
        return rows[0];
      }
    });
};

exports.selectArticles = (sort_by = "created_at", order = "desc", topic) => {
  let SQLString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id):: INT AS comment_count 
  FROM articles
  LEFT JOIN comments ON comments.article_id = articles.article_id
  `;

  const queryValues = [];
  const validSortBy = ["title", "topic", "author", "created_at", "votes"];
  const validOrder = ["asc", "desc", "ASC", "DESC"];

  if (!validSortBy.includes(sort_by)) {
    throw { status: 400, msg: "Invalid sort_by column" };
  }
  if (!validOrder.includes(order)) {
    throw { status: 400, msg: "Invalid order" };
  }

  const checkTopic = topic
    ? checkTopicExists(topic).then(() => {
        SQLString += ` WHERE articles.topic = $1`;
        queryValues.push(topic);
      })
    : Promise.resolve();

  return checkTopic.then(() => {
    SQLString += ` GROUP BY articles.article_id ORDER BY articles.${sort_by} ${order.toUpperCase()}`;
    return db.query(SQLString, queryValues).then(({ rows }) => {
      return rows;
    });
  });
};

exports.updateArticle = (article_id, newVotes) => {
  const SQLString = `
  UPDATE articles 
  SET votes = votes + $1 
  WHERE article_id = $2 
  RETURNING *`;
  return db
    .query(SQLString, [newVotes.inc_votes, article_id])
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Article not found" });
      } else {
        return rows[0];
      }
    });
};
