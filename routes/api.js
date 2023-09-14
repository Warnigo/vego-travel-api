const fs = require("fs");
const path = require("path");
const Router = require("express").Router;
const config = require("../constants/index.js");
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

  res.json({
    status: true,
    message: "ok",
    amount: amount,
  });
});

router.post("/payment/handle", (req, res) => {
  let authToken = req.header("Authorization");
  authToken = Buffer.from(authToken, "base64").toString("ascii");
  const [_login, _password] = authToken.split(":");

  if (_login !== config.PAYME_LOGIN && _password !== config.PAYME_PASSWORD) {
    return res.json({
      result: null,
      error: controller.ERROR_INSUFFICIENT_PRIVILEGE,
      message: "Insufficient privilege to perform this method.",
    });
  }

  switch (req.body.method) {
    case "CheckPerformTransaction":
      controller.CheckPerformTransaction(req, res);
      break;

    case "":
      break;
  }
});

module.exports = router;
