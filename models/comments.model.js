const db = require("../db/connection");

exports.selectCommentsByArticleId = (article_id) => {
  // An empty array could be because there aren't any comments for that ID and shouldn't be treated as an error...

  const checkArticleExists = "SELECT * FROM articles WHERE article_id=$1";
  return db.query(checkArticleExists, [article_id]).then(({ rows }) => {
    if (rows.length === 0) {
      return Promise.reject({ msg: "Article not found" });
    }

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
    return Promise.reject({ msg: "Incorrect data type" });
  }

  const checkArticleExists = "SELECT * FROM articles WHERE article_id=$1";
  return db.query(checkArticleExists, [article_id]).then(({ rows }) => {
    if (rows.length === 0) {
      return Promise.reject({ msg: "Article not found" });
    }

    const SQLString = `
    INSERT INTO comments (body, votes, author, article_id, created_at) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`;
    const currentTimestamp = new Date();
    const args = [body, 0, username, article_id, currentTimestamp];

    return db.query(SQLString, args).then(({ rows }) => {
      return rows[0];
    });
  });
};
