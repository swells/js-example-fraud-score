/*
 * GET home page.
 */
exports.index = function(req, res) {
  res.sendFile('./app/index.html');
};
