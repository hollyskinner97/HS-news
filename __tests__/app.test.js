const endpointsJson = require("../endpoints.json");
const request = require("supertest");
const app = require("../app");
const seed = require("../db/seeds/seed");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const articles = require("../db/data/test-data/articles");

beforeEach(() => {
  return seed(testData);
});

afterAll(() => {
  return db.end(); // this closes the connection to the database
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

  test("Responds with 404 when trying to access an invalid endpoint", () => {
    return request(app)
      .get("/api/topix")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Route not found");
      });
  });

  test("Responds with 404 for unsupported HTTP methods on existing routes", () => {
    return request(app)
      .post("/api/topics")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Route not found");
      });
  });
});

describe("GET /api/articles/:article_id", () => {
  test("200: should return an article object with the correct properties, given a valid article id", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const article = body.article;

        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: expect.any(Number),
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
        });
      });
  });

  test("should return 404 when given an article id which is out of range / invalid", () => {
    return request(app)
      .get("/api/articles/999")
      .expect(404)
      .then((response) => {
        expect(response.body.error).toBe("Not found");
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
