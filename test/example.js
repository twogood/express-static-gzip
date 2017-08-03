const express = require("express");
const staticGzip = require("..");

let app = express();
app.use("/", staticGzip("static"));

app.listen(8080);