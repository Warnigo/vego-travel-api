exports.STATE_CREATED = 1;
exports.STATE_COMPLETED = 2;
exports.STATE_CANCELED = -1;
exports.STATE_CANCELED_AFTER_COMPLETE = -2;

exports.tiyinToSum = (sum) => {
  return Number(sum) / 100;
};

exports.sumToTiyin = (tiyin) => {
  return Number(tiyin) * 100;
};
