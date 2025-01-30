const { selectTopics, insertTopic } = require("../models/topics.model");

exports.getTopics = (req, res, next) => {
  selectTopics()
    .then((topics) => {
      res.status(200).send({ topics });
    })
    .catch(next);
};

exports.postTopic = (req, res, next) => {
  const newTopic = req.body;
  insertTopic(newTopic)
    .then((postedTopic) => {
      res.status(201).send({ topic: postedTopic });
    })
    .catch(next);
};
