const fs = require("fs");
const path = require("path");
const Router = require("express").Router;
const config = require("../constants/index.js");
const utils = require("../utils");
const router = Router();

const controller = require("../controllers/payment.js");

router.post("/register", (req, res) => {
  const uuid = Math.random().toString(30).substring(2);
  const jsonFile = path.join(process.cwd(), "db/users.json");
  const data = req.body;

  // Agarda db/users.json fayl bo'lmasa, fayl yaratish
  if (!fs.existsSync(jsonFile)) {
    const jsonData = JSON.stringify([{ ...data, id: uuid }], null, 2);
    fs.writeFileSync(jsonFile, jsonData);
  }

  // Agarda db/users.json bor bo'lsa, userni qo'shib qo'yish
  else {
    let jsonData = fs.readFileSync(jsonFile);
    jsonData = JSON.parse(jsonData);
    jsonData.push({ ...data, id: uuid });
    jsonData = JSON.stringify(jsonData, null, 2);

    fs.writeFileSync(jsonFile, jsonData);
  }

  res.status(200).json({
    status: true,
    uuid: uuid,
  });
});

router.get("/payment", (req, res) => {
  const { user_id, amount } = req.query;
  if (!user_id || !amount) {
    return res.status(400).json({
      status: false,
      reason: "User id or amount not found or undefined",
    });
  }

  const usersFile = path.join(process.cwd(), "db/users.json");
  const usersData = fs.readFileSync(usersFile, "utf-8");
  const userData = JSON.parse(usersData).find((data) => data.id === user_id);
  const jsonFile = path.join(process.cwd(), "db/payments.json");

  if (!fs.existsSync(jsonFile)) {
    const jsonData = [];
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 4), "utf-8");
  }

  const paymentData = JSON.parse(fs.readFileSync(jsonFile, "utf-8")).find(
    (data) =>
      data.account.full_name ===
        `${userData.firstName} ${userData.lastName ?? ""}`.trim() &&
      data.account.phone_number === userData.phoneNumber
  );
  if (!paymentData) {
    const jsonData = JSON.parse(fs.readFileSync(jsonFile));
    jsonData.push({
      id: "",
      account: {
        full_name: `${userData.firstName} ${userData.lastName ?? ""}`.trim(),
        phone_number: userData.phoneNumber,
      },
      transaction: "",
      amount: utils.sumToTiyin(amount),
      state: utils.STATE_CREATED,
      time: "",
      create_time: "",
      perform_time: "",
      cancel_time: "",
    });

    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 4), "utf-8");
  }

  res.json({
    status: true,
    message: "ok",
    amount: amount,
    tiyin: utils.sumToTiyin(amount),
  });
});

router.post("/payment/handle", (req, res) => {
  let authToken =
    req.headers["authorization"] || req.headers["Authorization"] || "";

  authToken = Buffer.from(authToken.split(" ")[1], "base64").toString();
  const [_login, _password] = authToken.split(":");

  if (_login !== config.PAYME_LOGIN && _password !== config.PAYME_PASSWORD) {
    return res.json({
      result: null,
      error: {
        code: controller.ERROR_INSUFFICIENT_PRIVILEGE,
        message: "Insufficient privilege to perform this method.",
      },
    });
  }

  console.log("ok");

  switch (req.body.method) {
    case "CheckPerformTransaction":
      controller.CheckPerformTransaction(req, res);
      break;

    case "CreateTransaction":
      controller.CreateTransaction(req, res);
      break;

    case "PerformTransaction":
      controller.PerformTransaction(req, res);
      break;

    case "CancelTransaction":
      controller.CancelTransaction(req, res);
      break;

    case "CheckTransaction":
      controller.CheckTransaction(req, res);
      break;

    case "GetStatement":
      controller.GetStatement(req, res);
      break;

    default:
      return res.json({
        result: null,
        error: {
          code: controller.ERROR_METHOD_NOT_FOUND,
          message: "Method not found",
        },
      });
  }
});

module.exports = router;
