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
