const endpointsJson = require("../endpoints.json");
const request = require("supertest");
const app = require("../app");
const seed = require("../db/seeds/seed");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const { toBeSorted, toBeSortedBy } = require("jest-sorted");
const articles = require("../db/data/test-data/articles");

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
      .then(({ body: { error } }) => {
        expect(error).toBe("Route not found");
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
      .then(({ body: { article } }) => {
        expect(article).toEqual({
          article_id: 1,
          title: "Living in the shadow of a great man",
          topic: "mitch",
          author: "butter_bridge",
          body: "I find this existence challenging",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
          comment_count: 11,
        });
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .get("/api/articles/999")
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .get("/api/articles/whoops")
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
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

  test("200: should order the articles by date in descending order by default", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(articles).toBeSorted({ key: "created_at", descending: true });
      });
  });

  describe("Queries: sort_by, order, topic", () => {
    test("200: should be able to sort by any valid column e.g. title", () => {
      return request(app)
        .get("/api/articles?sort_by=title")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSorted({ key: "title", descending: true });
        });
    });

    test("should return 400 when given a column that is not allowed", () => {
      return request(app)
        .get("/api/articles?sort_by=body")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Invalid sort_by column");
        });
    });

    test("should return 400 when given a column that does not exist", () => {
      return request(app)
        .get("/api/articles?sort_by=whoops")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Invalid sort_by column");
        });
    });

    test("200: should return the results in ascending order, overwriting the default descending order", () => {
      return request(app)
        .get("/api/articles?order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSorted({ key: "created_at", ascending: true });
        });
    });

    test("should return 400 when given an order that is invalid", () => {
      return request(app)
        .get("/api/articles?order=whoops")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Invalid order");
        });
    });

    test("200: should be able to handle a sort_by and order query in tandem", () => {
      return request(app)
        .get("/api/articles?&sort_by=votes&order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSorted({ key: "votes", ascending: true });
        });
    });

    test("200: should be able to filter the articles by the topic value given", () => {
      return request(app)
        .get("/api/articles?topic=mitch")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(12);

          articles.forEach((article) => {
            expect(article.topic).toBe("mitch");
          });
        });
    });

    test("200: should return an empty array when given a topic that is valid but does not match any articles", () => {
      return request(app)
        .get("/api/articles?topic=paper")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(0);
          expect(Array.isArray(articles)).toBe(true);
        });
    });

    test("should return 404 when given a topic that does not exist in the database", () => {
      return request(app)
        .get("/api/articles?topic=whoops")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Topic not found");
        });
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
        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBe(0);
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .get("/api/articles/999/comments")
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .get("/api/articles/whoops/comments")
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: should respond with the posted comment", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(201)
      .then(({ body: { comment } }) => {
        expect(comment.author).toBe("butter_bridge");
        expect(comment.body).toBe("wow so cool");
        expect(comment.votes).toBe(0);
        expect(comment.article_id).toBe(1);
        expect(typeof comment.created_at).toBe("string");
      });
  });

  test("should return 400 when given missing keys/malformed input", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: "butter_bridge" })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 400 when input has an incorrect data type", () => {
    return request(app)
      .post("/api/articles/1/comments")
      .send({ username: 5, body: "wow so cool" })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .post("/api/articles/999/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .post("/api/articles/whoops/comments")
      .send({ username: "butter_bridge", body: "wow so cool" })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });
});

describe("PATCH /api/articles/:article_id", () => {
  test("200: should return the updated article with votes value amended", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200)
      .then(({ body: { article } }) => {
        expect(article).toEqual({
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
      .then(({ body: { article } }) => {
        expect(article.votes).toBe(99);
      });
  });

  test("should return 400 when passed a req body with missing fields", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({})
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 400 when passed a req body with invalid fields", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: "four" })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .patch("/api/articles/999")
      .send({ inc_votes: 4 })
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Article not found");
      });
  });

  test("should return 400 when given an article id which is not a number", () => {
    return request(app)
      .patch("/api/articles/whoops")
      .send({ inc_votes: 4 })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });
});

describe("PATCH /api/comments/:comment_id", () => {
  test("200: should return the updated comment with votes value amended", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: 1 })
      .expect(200)
      .then(({ body: { comment } }) => {
        expect(comment).toEqual({
          body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
          votes: 17,
          author: "butter_bridge",
          article_id: 9,
          created_at: "2020-04-06T12:17:00.000Z",
          comment_id: 1,
        });
      });
  });

  test("200: should update the votes correctly when given a negative increment value", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: -1 })
      .expect(200)
      .then(({ body: { comment } }) => {
        expect(comment.votes).toBe(15);
      });
  });

  test("should return 400 when passed a req body with missing fields", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({})
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 400 when passed a req body with invalid fields", () => {
    return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: "four" })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });

  test("should return 404 when given an comment id which is out of range / invalid", () => {
    return request(app)
      .patch("/api/comments/999")
      .send({ inc_votes: 4 })
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Comment not found");
      });
  });

  test("should return 400 when given an comment id which is not a number", () => {
    return request(app)
      .patch("/api/comments/whoops")
      .send({ inc_votes: 4 })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
      });
  });
});

describe("DELETE /api/comments/:comment_id", () => {
  test("204: Should respond with a 204 and no content", () => {
    return request(app)
      .delete("/api/comments/1")
      .expect(204)
      .then(({ body }) => {
        expect(body).toEqual({});
      });
  });

  test("should return 404 if the comment id is out of range", () => {
    return request(app)
      .delete("/api/comments/1000")
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Comment not found");
      });
  });

  test("should return 400 if the comment id is invalid / not a number", () => {
    return request(app)
      .delete("/api/comments/whoops")
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBe("Bad request");
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

describe("GET /api/users/:username", () => {
  test("200: should return a user object with the correct properties when given a username", () => {
    return request(app)
      .get("/api/users/butter_bridge")
      .expect(200)
      .then(({ body: { user } }) => {
        expect(user).toEqual({
          username: "butter_bridge",
          name: "jonny",
          avatar_url:
            "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg",
        });
      });
  });

  test("should return 404 when given a username that does not exist", () => {
    return request(app)
      .get("/api/users/holly")
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("User not found");
      });
  });
});
