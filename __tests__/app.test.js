const endpointsJson = require("../endpoints.json");
const request = require("supertest");
const app = require("../app");
const seed = require("../db/seeds/seed");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const { toBeSorted, toBeSortedBy } = require("jest-sorted");

beforeEach(() => {
  return seed(testData);
});

afterAll(() => {
  return db.end(); // this closes the connection to the database
});

describe("Invalid endpoint error", () => {
  test("Responds with 404 when trying to access an invalid endpoint", () => {
    return request(app)
      .get("/api/topix")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Route not found");
      });
  });
});

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});

describe("GET /api/topics", () => {
  test("200: Responds with an array of all the topics", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body: { topics } }) => {
        expect(topics.length).toBe(3);

        topics.forEach((topic) => {
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
        });
      });
  });
});

describe("GET /api/articles/:article_id", () => {
  test("200: should return an article object with the correct properties, given a valid article id", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        expect(body.article).toEqual({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        });
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .get("/api/articles/999")
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .get("/api/articles/whoops")
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });
});

describe("GET /api/articles", () => {
  test("200: should return an array of article objects with the correct properties", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles.length).toBe(13);

        articles.forEach((article) => {
          expect(article).toMatchObject({
            author: expect.any(String),
            title: expect.any(String),
            article_id: expect.any(Number),
            topic: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            article_img_url: expect.any(String),
            comment_count: expect.any(Number),
          });
        });
      });
  });

  test("200: should have a comment count property which counts the comments for the corresponding article", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles[0].comment_count).toBe(2);
      });
  });

  test("200: should order the articles by date in descending order", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles).toBeSorted({ key: "created_at", descending: true });
      });
  });
});

describe("GET /api/articles/:article_id/comments", () => {
  test("200: should return an array of comments for a given article id", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(11);

        comments.forEach((comment) => {
          expect(comment).toMatchObject({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            article_id: expect.any(Number),
          });
        });
      });
  });

  test("200: should order the comments with the most recent first", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments).toBeSorted({ key: "created_at", descending: true });
      });
  });

  test("200: should return an empty array rather than an error if given an id that is valid but has no comments", () => {
    return request(app)
      .get("/api/articles/2/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(comments.length).toBe(0);
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .get("/api/articles/999/comments")
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .get("/api/articles/whoops/comments")
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: should respond with the posted comment", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(201)
      .then((response) => {
        expect(response.body.comment.author).toBe("butter_bridge");
        expect(response.body.comment.body).toBe("wow so cool");
        expect(response.body.comment.votes).toBe(0);
        expect(response.body.comment.article_id).toBe(1);
        expect(typeof response.body.comment.created_at).toBe("string");
      });
  });

  test("should return 400 when given missing keys/malformed input", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: "butter_bridge" })
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });

  test("should return 400 when input has an incorrect data type", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: 5, body: "wow so cool" })
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .post("/api/articles/999/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .post("/api/articles/whoops/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });
});

describe("PATCH /api/articles/:article_id", () => {
  test("200: should return the updated article with votes value amended", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200)
      .then((response) => {
        expect(response.body.article).toEqual({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 101,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        });
      });
  });

  test("200: should update the votes correctly when given a negative increment value", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -1 })
      .expect(200)
      .then((response) => {
        expect(response.body.article.votes).toBe(99);
      });
  });

  test("should return 400 when passed a req body with missing fields", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({})
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });

  test("should return 400 when passed a req body with invalid fields", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: "four" })
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .patch("/api/articles/999")
      .send({ inc_votes: 4 })
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .patch("/api/articles/whoops")
      .send({ inc_votes: 4 })
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });
});

describe("DELETE /api/comments/:comment_id", () => {
  test("204: Should respond with a 204 and no content", () => {
    return request(app)
      .delete("/api/comments/1")
      .expect(204)
      .then((response) => {
        expect(response.body).toEqual({});
      });
  });

  test("should return 404 if the comment id is out of range", () => {
    return request(app)
      .delete("/api/comments/1000")
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Comment not found");
      });
  });

  test("should return 400 if the comment id is invalid / not a number", () => {
    return request(app)
      .delete("/api/comments/whoops")
      .expect(400)
      .then((response) => {
        expect(response.body.error).toBe("Bad request");
      });
  });
});

describe("GET /api/users", () => {
  test("200: should return an array of user objects with the correct properties", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body: { users } }) => {
        expect(users.length).toBe(4);

        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});
