var express = require("express");
var http = require("http");
var websocket = require("ws")

var Game = require('./public/js/main.js');
var port = process.env.PORT | '3000';

var app = express();
app.use(express.static(__dirname + "/public"));

const server = http.createServer(app).listen(port);

app.get("/", function(req, res) {
    res.sendFile('public/landing.html', {root: __dirname});
})

var games = {}
var currentConnectionId = 0;
const wss = new websocket.Server({server});

class GameStats {
    constructor() {
        this.gamesPlayed = 0;
        this.gamesRunning = 0;
        this.gamesWaiting = 0;
    }
}

let lifetimeStats = new GameStats();

wss.on("connection", function connection(ws) {
    let connection = ws;
    connection.id = connectionId++;
    
    ws.on('message', function incoming(jsonMessage) {
        var message = JSON.parse(jsonMessage);

        switch (message.type) {
            case 'create':
                var game = new Game(message.options.time, message.options.increment, message.options.side, connection);
        }
    })
})