var express = require("express");
var http = require("http");
var websocket = require("ws")

var port = process.env.PORT | '3000';
var app = express();

app.use(express.static(__dirname + "/public"));
http.createServer(app).listen(port);

app.get("/", function(req, res) {
    res.sendFile('public/landing.html', {root: __dirname});
})

var websockets = {};
const wss = new websocket.Server({server});
