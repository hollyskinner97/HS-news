# HS News API

## Live version

Hosted at: https://hs-news.onrender.com

---

## Overview:

This project is a RESTful API for managing articles, users, comments, and topics in a database-backed system.

The API includes functionality such as retrieving articles, creating new comments, and sorting articles based on various criteria.

The application is built with Node.js, Express, and PostgreSQL, and follows best practices for structuring backend applications.

---

## Requirements:

**Node.js**: Version 14.x or higher
**PostgreSQL**: Version 12.x or higher

---

## Setup Instructions:

1. Clone this repository to your local machine using Git:
   **git clone https://github.com/hollyskinner97/HS-news**
2. In the project directory, install the project dependencies:
   **npm install**
3. Create 3 .env files in the root directory for each database:
   - Name: **.env.development**
     Contents: PGDATABASE=nc_news
   - Name: **.env.test**
     Contents: PGDATABASE=nc_news_test
   - Name: **.env.production**
     Contents: DATABASE_URL=[Your url link here]
     _Note: These files will only exist locally, as they are listed in the git.ignore file. As per the connection.js file, the database will default to 'development' unless told otherwise._
4. Seed the local database: **npm run seed**
   Or use **npm run seed-prod** for production
5. Ensure the application is working by running the tests:
   **npm test**
6. Start the application: **npm start**

---

This portfolio project was created as part of a Digital Skills Bootcamp in Software Engineering provided by [Northcoders](https://northcoders.com/)
