const cors = require("cors");
const express = require("express");
const routes = require("./routes/api.js");
const app = express();

const NODE_ENV = process.env.NODE_ENV;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

if (NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server running on port 3000");
    console.log("http://127.0.0.1:3000");
  });
} else {
  app.listen();
}
