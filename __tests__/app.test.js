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
  test("404: should respond with error message when trying to access an invalid endpoint", () => {
    return request(app)
      .get("/api/topix")
      .expect(404)
      .then(({ body: { error } }) => {
        expect(error).toBe("Route not found");
      });
  });
});

describe("GET /api", () => {
  test("200: should respond with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});

describe("ARTICLES ENDPOINT", () => {
  describe("GET /api/articles", () => {
    test("200: should return an array of article objects with the correct properties", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).toBe(10); // 10 due to pagination

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

      test("400: should return error message when given a column that is not allowed", () => {
        return request(app)
          .get("/api/articles?sort_by=body")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Invalid sort_by column");
          });
      });

      test("400: should return error message when given a column that does not exist", () => {
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

      test("400: should return error message when given an order that is invalid", () => {
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

      test("404: should return error message when given a topic that does not exist in the database", () => {
        return request(app)
          .get("/api/articles?topic=whoops")
          .expect(404)
          .then(({ body: { error } }) => {
            expect(error).toBe("Topic not found");
          });
      });
    });

    describe("Pagination queries: limit and page", () => {
      let allArticles; // Store all articles for reference

      beforeEach(() => {
        return request(app)
          .get("/api/articles?limit=100") // All articles
          .expect(200)
          .then(({ body: { articles } }) => {
            allArticles = articles;
          });
      });

      test("200: should return the articles paginated according to the limit and page queries", () => {
        const expectedArticles = allArticles.slice(5, 10);
        return request(app)
          .get("/api/articles?limit=5&p=2")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles.length).toBe(5);
            expect(articles).toEqual(expectedArticles);
          });
      });

      test("200: should return the articles paginated according to the default limit of 10 when not given a limit", () => {
        const expectedArticles = allArticles.slice(0, 10);
        return request(app)
          .get("/api/articles?p=1")
          .expect(200)
          .then(({ body: { articles } }) => {
            // Should return articles 1-10
            expect(articles.length).toBe(10);
            expect(articles).toEqual(expectedArticles);
          });
      });

      test("200: should return the first page of articles as default when not given a p value", () => {
        const expectedArticles = allArticles.slice(0, 5);
        return request(app)
          .get("/api/articles?limit=5")
          .expect(200)
          .then(({ body: { articles } }) => {
            // Should return articles 1-5
            expect(articles.length).toBe(5);
            expect(articles).toEqual(expectedArticles);
          });
      });

      test("200: should return an empty array when given a p value out of range of the total articles", () => {
        return request(app)
          .get("/api/articles?p=5")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles.length).toBe(0);
            expect(Array.isArray(articles)).toBe(true);
          });
      });

      test("200: should also return a property of total_count which defaults to the number of articles if no filter is applied", () => {
        return request(app)
          .get("/api/articles?p=1&limit=5")
          .expect(200)
          .then(({ body: { total_count } }) => {
            expect(total_count).toBe(13);
          });
      });

      test("200: should return the correct total_count when a filter is applied", () => {
        return request(app)
          .get("/api/articles?p=1&limit=5&topic=mitch")
          .expect(200)
          .then(({ body: { total_count } }) => {
            expect(total_count).toBe(12);
          });
      });

      test("400: should return error message when given a p value less than 1", () => {
        return request(app)
          .get("/api/articles?p=0")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Limit and page number must be greater than 0");
          });
      });

      test("400: should return error message when given a limit less than 1", () => {
        return request(app)
          .get("/api/articles?limit=0")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Limit and page number must be greater than 0");
          });
      });

      test("400: should return bad request when given a p value that is not a number", () => {
        return request(app)
          .get("/api/articles?p=four")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Bad request");
          });
      });

      test("400: should return bad request when given a limit that is not a number", () => {
        return request(app)
          .get("/api/articles?limit=four")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Bad request");
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

    test("404: should return error message when given an article id which is out of range / invalid", () => {
      return request(app)
        .get("/api/articles/999")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Article not found");
        });
    });

    test("400: should return bad request when given an article id which is not a number", () => {
      return request(app)
        .get("/api/articles/whoops")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });

  describe("GET /api/articles/:article_id/comments", () => {
    test("200: should return an array of comments for a given article id", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          expect(comments.length).toBe(10); // 10 due to pagination

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

    test("404: should return error message when given an article id which is out of range / invalid", () => {
      return request(app)
        .get("/api/articles/999/comments")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Article not found");
        });
    });

    test("400: should return bad request when given an article id which is not a number", () => {
      return request(app)
        .get("/api/articles/whoops/comments")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    describe("Pagination queries: limit and page", () => {
      let allComments; // Store all articles for reference

      beforeEach(() => {
        return request(app)
          .get("/api/articles/1/comments?limit=100") // All comments
          .expect(200)
          .then(({ body: { comments } }) => {
            allComments = comments;
          });
      });

      test("200: should return the comments paginated according to the limit and page queries", () => {
        const expectedComments = allComments.slice(5, 10);
        return request(app)
          .get("/api/articles/1/comments?limit=5&p=2")
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments.length).toBe(5);
            expect(comments).toEqual(expectedComments);
          });
      });

      test("200: should return the comments paginated according to the default limit of 10 when not given a limit", () => {
        const expectedComments = allComments.slice(0, 10);
        return request(app)
          .get("/api/articles/1/comments?p=1")
          .expect(200)
          .then(({ body: { comments } }) => {
            // Should return comments 1-10
            expect(comments.length).toBe(10);
            expect(comments).toEqual(expectedComments);
          });
      });

      test("200: should return the first page of comments as default when not given a p value", () => {
        const expectedComments = allComments.slice(0, 5);
        return request(app)
          .get("/api/articles/1/comments?limit=5")
          .expect(200)
          .then(({ body: { comments } }) => {
            // Should return comments 1-5
            expect(comments.length).toBe(5);
            expect(comments).toEqual(expectedComments);
          });
      });

      test("200: should return an empty array when given a p value out of range of the total comments", () => {
        return request(app)
          .get("/api/articles/1/comments?p=5")
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments.length).toBe(0);
            expect(Array.isArray(comments)).toBe(true);
          });
      });

      test("400: should return error message when given a p value less than 1", () => {
        return request(app)
          .get("/api/articles/1/comments?p=0")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Limit and page number must be greater than 0");
          });
      });

      test("400: should return error message when given a limit less than 1", () => {
        return request(app)
          .get("/api/articles/1/comments?limit=0")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Limit and page number must be greater than 0");
          });
      });

      test("400: should return bad request when given a p value that is not a number", () => {
        return request(app)
          .get("/api/articles/1/comments?p=four")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Bad request");
          });
      });

      test("400: should return bad request when given a limit that is not a number", () => {
        return request(app)
          .get("/api/articles/1/comments?limit=four")
          .expect(400)
          .then(({ body: { error } }) => {
            expect(error).toBe("Bad request");
          });
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

    test("400: should return bad request when given missing keys/malformed input", () => {
      return request(app)
        .post("/api/articles/1/comments")
        .send({ username: "butter_bridge" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when input has an incorrect data type", () => {
      return request(app)
        .post("/api/articles/1/comments")
        .send({ username: 5, body: "wow so cool" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("404: should return error message when given an article id which is out of range / invalid", () => {
      return request(app)
        .post("/api/articles/999/comments")
        .send({ username: "butter_bridge", body: "wow so cool" })
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Article not found");
        });
    });

    test("400: should return bad request when given an article id which is not a number", () => {
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

    test("400: should return bad request when passed a req body with missing fields", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({})
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when passed a req body with invalid fields", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: "four" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("404: should return error message when given an article id which is out of range / invalid", () => {
      return request(app)
        .patch("/api/articles/999")
        .send({ inc_votes: 4 })
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Article not found");
        });
    });

    test("400: should return bad request when given an article id which is not a number", () => {
      return request(app)
        .patch("/api/articles/whoops")
        .send({ inc_votes: 4 })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });

  describe("DELETE /api/articles/:article_id", () => {
    test("204: Should respond with a 204 and no content", () => {
      return request(app)
        .delete("/api/articles/9")
        .expect(204)
        .then(({ body }) => {
          expect(body).toEqual({});
        });
    });

    test("204: Should delete the respective comments", () => {
      return request(app)
        .delete("/api/articles/9")
        .expect(204)
        .then(() => {
          return request(app)
            .get("/api/articles/9/comments")
            .expect(404)
            .then(({ body: { error } }) => {
              expect(error).toBe("Article not found");
            });
        });
    });

    test("404: should return error message if the article id is out of range", () => {
      return request(app)
        .delete("/api/articles/1000")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Article not found");
        });
    });

    test("400: should return bad request if the article id is invalid / not a number", () => {
      return request(app)
        .delete("/api/articles/whoops")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });

  describe("POST /api/articles", () => {
    test("201: should respond with the posted article", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: "butter_bridge",
          title: "New article",
          body: "This is a new article",
          topic: "mitch",
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        })
        .expect(201)
        .then(({ body: { article } }) => {
          expect(article.author).toBe("butter_bridge");
          expect(article.title).toBe("New article");
          expect(article.body).toBe("This is a new article");
          expect(article.topic).toBe("mitch");
          expect(article.article_img_url).toBe(
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
          );
          expect(article.article_id).toBe(14);
          expect(article.votes).toBe(0);
          expect(article.comment_count).toBe(0);
          expect(typeof article.created_at).toBe("string");
        });
    });

    test("200: should respond with the image url set to the default when none is given", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: "butter_bridge",
          title: "New article",
          body: "This is a new article",
          topic: "mitch",
        })
        .expect(201)
        .then(({ body: { article } }) => {
          expect(article.article_img_url).toBe(
            "https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?w=700&h=700"
          );
        });
    });

    test("400: should return bad request when given missing keys/malformed input", () => {
      return request(app)
        .post("/api/articles")
        .send({ author: "butter_bridge" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when input has an incorrect data type", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: "butter_bridge",
          title: ["New article"],
          body: "This is a new article",
          topic: "mitch",
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when input violates a foreign key constraint", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: "invalid_author",
          title: "New article",
          body: "This is a new article",
          topic: "mitch",
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
        })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });
});

describe("COMMENTS ENDPOINT", () => {
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

    test("400: should return bad request when passed a req body with missing fields", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({})
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when passed a req body with invalid fields", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({ inc_votes: "four" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("404: should return error message when given an comment id which is out of range / invalid", () => {
      return request(app)
        .patch("/api/comments/999")
        .send({ inc_votes: 4 })
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Comment not found");
        });
    });

    test("400: should return bad request when given an comment id which is not a number", () => {
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

    test("404: should return error message if the comment id is out of range", () => {
      return request(app)
        .delete("/api/comments/1000")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("Comment not found");
        });
    });

    test("400: should return bad request if the comment id is invalid / not a number", () => {
      return request(app)
        .delete("/api/comments/whoops")
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });
});

describe("TOPICS ENDPOINT", () => {
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

  describe("POST /api/topics", () => {
    test("201: should return the posted topic object with the correct properties", () => {
      return request(app)
        .post("/api/topics")
        .send({
          slug: "topic name here",
          description: "description here",
        })
        .expect(201)
        .then(({ body: { topic } }) => {
          expect(topic.slug).toBe("topic name here");
          expect(topic.description).toBe("description here");
        });
    });

    test("400: should return bad request when given missing keys/malformed input", () => {
      return request(app)
        .post("/api/topics")
        .send({
          slug: "topic name here",
        })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });

    test("400: should return bad request when input has an incorrect data type", () => {
      return request(app)
        .post("/api/topics")
        .send({ slug: [5], description: "description here" })
        .expect(400)
        .then(({ body: { error } }) => {
          expect(error).toBe("Bad request");
        });
    });
  });
});

describe("USERS ENDPOINT", () => {
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

    test("404: should return error message when given a username that does not exist", () => {
      return request(app)
        .get("/api/users/holly")
        .expect(404)
        .then(({ body: { error } }) => {
          expect(error).toBe("User not found");
        });
    });
  });
});
