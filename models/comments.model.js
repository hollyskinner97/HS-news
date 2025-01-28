const db = require("../db/connection");
const { checkArticleExists } = require("./utils");

exports.selectCommentsByArticleId = (article_id) => {
  return checkArticleExists(article_id).then(() => {
    const SQLString =
      "SELECT * FROM comments WHERE article_id=$1 ORDER BY created_at DESC";

    return db.query(SQLString, [article_id]).then(({ rows }) => {
      return rows;
    });
  });
};

exports.insertComment = (article_id, newComment) => {
  const { username, body } = newComment;

  if (typeof username !== "string" || typeof body !== "string") {
    return Promise.reject({ status: 400, msg: "Bad request" });
  }

  return checkArticleExists(article_id).then(() => {
    const SQLString = `
    INSERT INTO comments (body, author, article_id) 
    VALUES ($1, $2, $3) 
    RETURNING *`;
    const args = [body, username, article_id];

    return db.query(SQLString, args).then(({ rows }) => {
      return rows[0];
    });
  });
};
