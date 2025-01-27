const endpoints = require("../endpoints.json");

exports.getApiEndpoints = (req, res) => {
  res.status(200).send({ endpoints });
};
