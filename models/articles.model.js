const db = require("../db/connection");

exports.selectArticleById = (article_id) => {
  return db
    .query("SELECT * FROM articles WHERE article_id=$1", [article_id])
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ msg: "Article not found" });
      } else {
        return rows[0];
      }
    });
};

exports.selectArticles = () => {
  const SQLString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id):: INT AS comment_count 
  FROM articles
  LEFT JOIN comments ON comments.article_id = articles.article_id
  GROUP BY articles.article_id, articles.author, articles.title, articles.topic, articles.created_at, articles.votes, articles.article_img_url
  ORDER BY articles.created_at DESC`;
  return db.query(SQLString).then(({ rows }) => {
    return rows;
  });
};
