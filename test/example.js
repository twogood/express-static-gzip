const express = require("express");
const serveStatic = require("serve-static");
const staticGzip = require("..");

let app = express();

app.use("/folder", staticGzip("static"));

app.listen(8080);