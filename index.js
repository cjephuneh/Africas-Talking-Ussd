const express = require("express");
const ussdRoute = require("./ussd");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3009;

app.listen(PORT, () => console.log(`USSD service running on localhost:${PORT}`));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", ussdRoute);
