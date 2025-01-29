const db = require("../db/connection");

exports.updateCommentById = (comment_id, newVotes) => {
  const SQLString = `
    UPDATE comments 
    SET votes = votes + $1 
    WHERE comment_id = $2 
    RETURNING *`;
  return db
    .query(SQLString, [newVotes.inc_votes, comment_id])
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Comment not found" });
      } else {
        return rows[0];
      }
    });
};

exports.removeCommentById = (comment_id) => {
  return db
    .query(
      `
      DELETE FROM comments 
      WHERE comment_id=$1
      RETURNING *`,
      [comment_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Comment not found" });
      } else {
        return Promise.resolve();
      }
    });
};
