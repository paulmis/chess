var express = require("express");
var http = require("http");
var websocket = require("ws")
const { uuid } = require('uuidv4');

var Game = require('./public/js/game.js');
var port = process.env.PORT | '3000';

var app = express();
app.use(express.static(__dirname + "/public"));

const server = http.createServer(app).listen(port);

app.get("/", function(req, res) {
    res.sendFile('public/landing.html', {root: __dirname});
})

var games = new Map();
var awaiting = []
var currentConnectionId = 0;
const wss = new websocket.Server({server});

class GameStats {
    constructor() {
        this.gamesPlayed = 0;
        this.gamesRunning = 0;
        this.gamesWaiting = 0;
    }
}

function getUnstartedGameUid() {
    for (const [uid, game] of games) {
        if (game.getState() == 'unstarted')
            return uid;
    }
    return null;
}

let lifetimeStats = new GameStats();

wss.on("connection", function connection(ws) {
    ws.uid = uuid();
    ws.gameUid = null;
    
    ws.on('message', function incoming(jsonMessage) {
        var message = JSON.parse(jsonMessage);

        switch (message.type) {
            case 'create':
                var gameUid = uuid();
                games[gameUid] = new Game(message.time, message.increment, message.side, ws);
                break;
            case 'join':
                if (!ws.gameUid) {
                    var gameUid = getUnstartedGameUid();
                    if (!gameUid) {
                        awaiting.push(ws);
                    } else { 
                        ws.gameUid = gameUid;
                        games[gameUid].addPlayer(ws);
                        games[gameUid].start();
                    }
                }
                break;
            case 'move':
                if (games[ws.gameUid].movePiece(message))
                {
                    var gameState = games[ws.gameUid].getState();
                    if (gameState == 'unresolved') {
                        games[ws.gameUid].getCurrentPlayer().send({
                            'type': 'move'
                        });
                    } else if (gameState == 'white' || gameState == 'black') {
                        var players = games[ws.gameUid].getPlayers();
                        for (var player of players) 
                            player.send({
                                'type': 'finished',
                                'winner': gameState
                            });
                    }
                }
                break;
        }
    })
})