const path = require("path");
const fs = require("fs");
const utils = require("../utils");

const ERROR_INTERNAL_SYSTEM = -32400;
const ERROR_INSUFFICIENT_PRIVILEGE = -32504;
const ERROR_INVALID_JSON_RPC_OBJECT = -32600;
const ERROR_METHOD_NOT_FOUND = -32601;
const ERROR_INVALID_AMOUNT = -31001;
const ERROR_TRANSACTION_NOT_FOUND = -31003;
const ERROR_INVALID_ACCOUNT = -31050;
const ERROR_INVALID_TRANSACTION = -31051;
const ERROR_COULD_NOT_CANCEL = -31007;
const ERROR_COULD_NOT_PERFORM = -31008;

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const CheckPerformTransaction = (req, res) => {
  const params = req.body.params;

  const jsonFile = path.resolve(process.cwd(), "db/users.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));

  const user = jsonData.find((data) => {
    return (
      data.firstName === params.account.full_name &&
      data.phoneNumber === params.account.phone_number
    );
  });

  if (!user) {
    return res.json({
      result: null,
      error: ERROR_INVALID_ACCOUNT,
      message: "Object not fount.",
    });
  }

  if (parseInt(user.price) === parseInt(utils.tiyinToSum(params.amount))) {
    return res.json({
      result: null,
      error: ERROR_INVALID_AMOUNT,
      message: "Invalid amount for this object.",
    });
  }

  return res.json({
    allow: true,
  });
};

const CreateTransaction = () => {};

const PerformTransaction = () => {};

const CancelTransaction = () => {};

const CheckTransaction = () => {};

const GetStatement = () => {};

module.exports = {
  CheckPerformTransaction,
  CreateTransaction,
  PerformTransaction,
  CheckTransaction,
  GetStatement,
  CancelTransaction,

  ERROR_INTERNAL_SYSTEM,
  ERROR_INSUFFICIENT_PRIVILEGE,
  ERROR_INVALID_JSON_RPC_OBJECT,
  ERROR_METHOD_NOT_FOUND,
  ERROR_INVALID_AMOUNT,
  ERROR_TRANSACTION_NOT_FOUND,
  ERROR_INVALID_ACCOUNT,
  ERROR_INVALID_TRANSACTION,
  ERROR_COULD_NOT_CANCEL,
  ERROR_COULD_NOT_PERFORM,
};
