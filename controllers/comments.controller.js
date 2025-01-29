const {
  removeCommentById,
  updateCommentById,
} = require("../models/comments.model");

exports.patchCommentById = (req, res, next) => {
  const { comment_id } = req.params;
  const newVotes = req.body;
  updateCommentById(comment_id, newVotes)
    .then((comment) => {
      res.status(200).send({ comment });
    })
    .catch(next);
};

exports.deleteCommentById = (req, res, next) => {
  const { comment_id } = req.params;
  removeCommentById(comment_id)
    .then(() => {
      res.status(204).send();
    })
    .catch(next);
};
