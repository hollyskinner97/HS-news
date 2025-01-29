# Northcoders News API

Create 3 .env files in the repo root for each of your databases:

1. File name: .env.development
   File contents: PGDATABASE=nc_news
2. File name: .env.test
   File contents: PGDATABASE=nc_news_test
3. File name: .env.production
   File contents: DATABASE_URL=[Your url link here]

These files will only exist locally, as they are listed in the git.ignore file.

As per the connection.js file, the database will default to 'development' unless told otherwise.

---

This portfolio project was created as part of a Digital Skills Bootcamp in Software Engineering provided by [Northcoders](https://northcoders.com/)
