var express = require("express");
var http = require("http");
var websocket = require("ws")
const Game = require('./game.js');
const { v4: uuidv4 } = require('uuid');
var bodyParser = require('body-parser')

var port = process.env.PORT | '3000';

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({extended: true})); 
const server = http.createServer(app).listen(port);

app.get("/", function(req, res) {
    res.sendFile('public/landing.html', {root: __dirname});
})

app.get("/game", function(req, res) {
    res.sendFile('public/game.html', {root: __dirname});
})

const wss = new websocket.Server({server});

class GameStats {
    constructor() {
        this.gamesPlayed = 0;
        this.gamesRunning = 0;
        this.gamesWaiting = 0;
    }
}

var games = new Map();
var players = new Map();
var awaiting = []

function getUnstartedGameUid() {
    for (const [uid, game] of games) {
        if (game.getState() == 'unstarted')
            return uid;
    }
    return null;
}

let lifetimeStats = new GameStats();

function startGame(gameUid) {
    var game = games.get(gameUid);
    if (game.canStart() && game.start()) {
        for (const [color, playerUid] of game.getPlayerKeysAndColors()) {
            players[playerUid].send(JSON.stringify({
                'type': 'start',
                'gameUid': gameUid,
                'side': color
            }));
        }
        console.log('game ', gameUid, ' started');
        return true;
    }
    console.log('game ', gameUid, ' failed to start');
    return false;
}

wss.on("connection", function connection(ws, req) {
    ws.uid = uuidv4();
    players[ws.uid] = ws;
    console.log('new connection - ', ws.uid);
    
    ws.on('message', function incoming(jsonMessage) {
        var message = JSON.parse(jsonMessage);
        console.log('new message ', message);

        switch (message.type) {
            // Create a new game
            case 'create':
                var gameUid = uuidv4();
                games.set(gameUid, new Game(ws.uid, message.time, message.increment, message.side));
                console.log('CREATED ', games.get(gameUid));
                ws.send(JSON.stringify({
                    'type': 'created',
                    'gameUid': gameUid,
                }));
                break;
            case 'join':
                // Join a game that's waiting for a player
                if (!message.playerUid) {
                    var gameUid = getUnstartedGameUid();
                    if (gameUid) {
                        console.log(gameUid, games);
                        games.get(gameUid).addPlayer(ws.uid);
                        startGame(gameUid);
                    } else {
                        // Create a new game
                        if (awaiting.length >= 1) {
                            var gameUid = uuidv4(), otherPlayerUid = awaiting.shift();
                            games.set(gameUid, new Game(ws.uid));
                            games.get(gameUid).addPlayer(otherPlayerUid);
                            startGame(gameUid);
                        // Wait to join a game
                        } else {
                            awaiting.push(ws.uid);
                            ws.send(JSON.stringify({
                                'type': 'waiting',
                            }));
                        }
                    }
                } else {
                    console.log('todo');
                }
                break;
            case 'move':
                var game = games.get(message.gameUid);
                if (game.getState() == 'unresolved' && ws.uid == game.getCurrentPlayerKey() && game.attemptMove(message)) {
                    // Affirm the move was successful
                    ws.send(JSON.stringify({
                        'type': 'move',
                        'moved': 'yes',
                        'side': game.board.getCurrentPlayerColor(),
                        'from': message.from,
                        'to': message.to
                    }));

                    // Wait for the next player's move
                    players[game.getCurrentPlayerKey()].send(JSON.stringify({
                        'type': 'move',
                        'moved': 'yes',
                        'side': game.board.getCurrentPlayerColor(),
                        'from': message.from,
                        'to': message.to
                    }));

                    // Inform that the game ended
                    if (game.getState() != 'unresolved') {
                        ws.send(JSON.stringify({
                            'type': 'finished',
                            'winner': game.getState()
                        }));
                        players[game.getCurrentPlayerKey()].send(JSON.stringify({
                            'type': 'finished',
                            'winner': game.getState()
                        }));
                    }

                } else {
                    // Message that the move wasn't successful
                    ws.send(JSON.stringify({
                        'type': 'move',
                        'moved': 'no',
                        'side': game.board.getCurrentPlayerColor()
                    }));
                }
                break;
        }
    });

    ws.on('close', function(message) {
        console.log('end connection ' - ws.uid);
        players.delete(ws.uid);
    });
})