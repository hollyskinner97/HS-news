const db = require("../db/connection");

exports.selectTopics = () => {
  return db.query("SELECT * FROM topics").then(({ rows }) => {
    return rows;
  });
};

exports.insertTopic = (newTopic) => {
  const { slug, description } = newTopic;

  if (typeof slug !== "string" || typeof description !== "string") {
    return Promise.reject({ status: 400, msg: "Bad request" });
  }

  const SQLString = `
  INSERT INTO topics (slug, description)
  VALUES ($1,$2)
  RETURNING *`;

  return db.query(SQLString, [slug, description]).then(({ rows }) => {
    return rows[0];
  });
};
