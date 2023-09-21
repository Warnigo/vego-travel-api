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

  const jsonFile = path.resolve(process.cwd(), "db/payments.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));

  const transaction = jsonData.find((data) => {
    return (
      data.account.full_name === params.account.full_name &&
      data.account.phone_number === params.account.phone_number
    );
  });

  if (!transaction) {
    return res.json({
      result: null,
      error: {
        code: ERROR_INVALID_ACCOUNT,
        message: "Transaction not found",
      },
    });
  }

  if (Number(transaction.amount) !== Number(params.amount)) {
    return res.json({
      result: null,
      error: {
        code: ERROR_INVALID_AMOUNT,
        message: "Invalid amount for this object.",
      },
    });
  }

  return res.json({
    result: {
      allow: true,
    },
  });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const CreateTransaction = (req, res) => {
  const { params } = req.body;
  const jsonFile = path.resolve(process.cwd(), "db/payments.json");
  let jsonData = fs.readFileSync(jsonFile, "utf-8");

  let transactionId = JSON.parse(jsonData).findIndex(
    (data) =>
      data.account.full_name === params.account.full_name &&
      data.account.phone_number === params.account.phone_number
  );
  let transaction = JSON.parse(jsonData).find(
    (data) =>
      data.account.full_name === params.account.full_name &&
      data.account.phone_number === params.account.phone_number
  );

  if (!transaction) {
    return res.json({
      result: null,
      error: {
        code: ERROR_INVALID_ACCOUNT,
        message: "Transaction not fount.",
      },
      id: params.id,
    });
  }

  if (transaction.id !== "" && transaction.id !== params.id) {
    return res.json({
      result: null,
      error: {
        code: ERROR_INVALID_ACCOUNT,
        message: "Transaction found",
      },
    });
  }

  if (transaction.id !== "" && transaction.id === params.id) {
    return res.json({
      result: {
        create_time: transaction.create_time,
        transaction: transaction.transaction,
        state: transaction.state,
      },
    });
  }

  if (Number(transaction.amount) !== Number(params.amount)) {
    return res.json({
      result: null,
      error: {
        code: ERROR_INVALID_AMOUNT,
        message: "Incorrect amount.",
      },
      id: params.id,
    });
  }

  const old_transaction = JSON.parse(jsonData).find(
    (data) => data.id === params.id
  );

  if (old_transaction) {
    if (old_transaction.state === utils.STATE_CREATED) {
      return res.json({
        result: null,
        error: {
          code: ERROR_COULD_NOT_PERFORM,
          message: "Transaction found, but is not active.",
        },
      });
    } else if (
      old_transaction.state === utils.STATE_CANCELED ||
      old_transaction.state === utils.STATE_CANCELED_AFTER_COMPLETE
    ) {
      return res.json({
        result: null,
        error: {
          code: ERROR_COULD_NOT_PERFORM,
          message: "Transaction cancelled.",
        },
      });
    }
  }

  transaction.id = params.id;
  transaction.time = params.time;
  transaction.transaction = `${params.id}-${Math.ceil(Math.random() * 9999)
    .toString(32)
    .substring(2)}`;
  transaction.create_time = Date.now();

  // prettier-ignore
  jsonData = JSON.parse(jsonData);
  jsonData.splice(transactionId, 1, transaction);

  fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 4));

  return res.json({
    result: {
      create_time: transaction.create_time,
      transaction: transaction.transaction,
      state: transaction.state,
    },
  });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const PerformTransaction = (req, res) => {
  const { params } = req.body;
  const jsonFile = path.join(process.cwd(), "db/payments.json");
  let jsonData = fs.readFileSync(jsonFile, "utf-8");

  const transactionId = JSON.parse(jsonData).findIndex(
    (data) => data.id === params.id
  );
  const transactionData = JSON.parse(jsonData).find(
    (data) => data.id === params.id
  );

  if (!transactionData) {
    return res.json({
      result: null,
      error: {
        code: ERROR_TRANSACTION_NOT_FOUND,
        message: "Transaction not found.",
      },
    });
  }

  switch (transactionData.state) {
    case utils.STATE_CREATED:
      transactionData.state = utils.STATE_COMPLETED;
      transactionData.perform_time = Date.now();

      jsonData = JSON.parse(jsonData);
      jsonData.splice(transactionId, 1, transactionData);
      fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 4), "utf-8");

      return res.json({
        result: {
          transaction: transactionData.transaction,
          perform_time: transactionData.perform_time,
          state: transactionData.state,
        },
      });

    case utils.STATE_COMPLETED:
      return res.json({
        result: {
          transaction: transactionData.transaction,
          perform_time: transactionData.perform_time,
          state: transactionData.state,
        },
      });

    default:
      return res.json({
        result: null,
        error: {
          code: ERROR_COULD_NOT_PERFORM,
          message: "Could not perform this operation.",
        },
      });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const CancelTransaction = (req, res) => {
  const { params } = req.body;
  const jsonFile = path.join(process.cwd(), "db/payments.json");
  let jsonData = fs.readFileSync(jsonFile, "utf-8");

  const transactionId = JSON.parse(jsonData).findIndex(
    (data) => data.id === params.id
  );
  const transactionData = JSON.parse(jsonData).find(
    (data) => data.id === params.id
  );

  if (!transactionData) {
    return res.json({
      result: null,
      error: {
        code: ERROR_TRANSACTION_NOT_FOUND,
        message: "Transaction not found",
      },
    });
  }

  switch (transactionData.state) {
    case utils.STATE_CANCELED:
    case utils.STATE_CANCELED_AFTER_COMPLETE:
      return res.json({
        result: {
          transaction: transactionData.transaction,
          cancel_time: transactionData.cancel_time,
          state: transactionData.state,
        },
      });

    case utils.STATE_CREATED:
      transactionData.state = utils.STATE_CANCELED;
      break;

    case utils.STATE_COMPLETED:
      transactionData.state = utils.STATE_CANCELED_AFTER_COMPLETE;
      break;
  }

  transactionData.reason = params.reason ?? null;
  transactionData.cancel_time = Date.now();

  jsonData = JSON.parse(jsonData);
  jsonData.splice(transactionId, 1, transactionData);
  fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 4), "utf-8");

  return res.json({
    result: {
      transaction: transactionData.transaction,
      cancel_time: transactionData.cancel_time,
      state: transactionData.state,
    },
  });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const CheckTransaction = (req, res) => {
  const { params } = req.body;
  const jsonFile = path.join(process.cwd(), "db/payments.json");
  let jsonData = fs.readFileSync(jsonFile, "utf-8");

  const transaction = JSON.parse(jsonData).find(
    (data) => data.id === params.id
  );

  if (!transaction) {
    return res.json({
      result: null,
      error: {
        code: ERROR_TRANSACTION_NOT_FOUND,
        message: "Transaction not found",
      },
    });
  }

  return res.json({
    result: {
      create_time: transaction.create_time,
      perform_time: transaction.perform_time,
      cancel_time: transaction.cancel_time,
      transaction: transaction.transaction,
      state: transaction.state,
      reason: transaction.reason,
    },
  });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetStatement = (req, res) => {
  const { params } = req.body;
  const jsonFile = path.join(process.cwd(), "db/payments.json");
  let jsonData = fs.readFileSync(jsonFile, "utf-8");

  const transactions = JSON.parse(jsonData).filter(
    (data) =>
      Number(data.create_time) >= Number(params.from) &&
      Number(data.create_time) <= Number(params.to)
  );

  if (!transactions.length) {
    return res.json({
      result: null,
      error: {
        code: ERROR_TRANSACTION_NOT_FOUND,
        message: "Transaction not found",
      },
    });
  }

  return res.json({
    result: {
      transactions,
    },
  });
};

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
