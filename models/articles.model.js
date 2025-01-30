const db = require("../db/connection");
const { checkTopicExists, checkArticleExists } = require("./utils");

exports.selectArticleById = (article_id) => {
  const SQLString = `
  SELECT articles.*, COUNT(comments.comment_id):: INT AS comment_count
  FROM articles 
  LEFT JOIN comments ON comments.article_id = articles.article_id
  WHERE articles.article_id=$1
  GROUP BY articles.article_id`;

  return db.query(SQLString, [article_id]).then(({ rows }) => {
    if (rows.length === 0) {
      return Promise.reject({ status: 404, msg: "Article not found" });
    } else {
      return rows[0];
    }
  });
};

exports.selectArticles = (
  sort_by = "created_at",
  order = "desc",
  topic,
  limit = 10,
  p = 1
) => {
  const offset = (p - 1) * limit;
  const validSortBy = ["title", "topic", "author", "created_at", "votes"];
  const validOrder = ["asc", "desc", "ASC", "DESC"];

  if (limit < 1 || p < 1) {
    throw { status: 400, msg: "Limit and page number must be greater than 0" };
  }
  if (!validSortBy.includes(sort_by)) {
    throw { status: 400, msg: "Invalid sort_by column" };
  }
  if (!validOrder.includes(order)) {
    throw { status: 400, msg: "Invalid order" };
  }

  let totalCountQuery = `SELECT COUNT(*)::INT AS total_count FROM articles`;

  let SQLString = `
  SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id):: INT AS comment_count 
  FROM articles
  LEFT JOIN comments ON comments.article_id = articles.article_id
  `;

  const queryValues = [];

  const checkTopic = topic
    ? checkTopicExists(topic).then(() => {
        totalCountQuery += ` WHERE topic = $1`;
        SQLString += ` WHERE articles.topic = $1`;
        queryValues.push(topic);
      })
    : Promise.resolve();

  return checkTopic.then(() => {
    SQLString += ` 
    GROUP BY articles.article_id 
    ORDER BY articles.${sort_by} ${order.toUpperCase()}, articles.article_id DESC
    LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`;
    queryValues.push(Number(limit), Number(offset));

    return db
      .query(totalCountQuery, queryValues.slice(0, topic ? 1 : 0))
      .then(({ rows }) => {
        const total_count = rows[0].total_count;

        return db.query(SQLString, queryValues).then(({ rows: articles }) => {
          return { articles, total_count };
        });
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

exports.selectCommentsByArticleId = (article_id, limit = 10, p = 1) => {
  const offset = (p - 1) * limit;

  if (limit < 1 || p < 1) {
    throw {
      status: 400,
      msg: "Limit and page number must be greater than 0",
    };
  }
  return checkArticleExists(article_id).then(() => {
    const SQLString = `
      SELECT * FROM comments 
      WHERE article_id=$1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`;

    const queryValues = [article_id, Number(limit), Number(offset)];

    return db.query(SQLString, queryValues).then(({ rows }) => {
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

exports.insertArticle = (newArticle) => {
  const { author, title, body, topic, article_img_url } = newArticle;
  const imageURL =
    article_img_url ||
    "https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?w=700&h=700";

  if (
    typeof author !== "string" ||
    typeof title !== "string" ||
    typeof body !== "string" ||
    typeof topic !== "string" ||
    typeof imageURL !== "string"
  ) {
    return Promise.reject({ status: 400, msg: "Bad request" });
  }

  const SQLString = `
    INSERT INTO articles (author, title, body, topic, article_img_url) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *, 0 AS comment_count`;
  const args = [author, title, body, topic, imageURL];

  return db.query(SQLString, args).then(({ rows }) => {
    return rows[0];
  });
};
