var express = require("express");
var http = require("http");
var websocket = require("ws")
const Game = require('./game.js');
const { v4: uuidv4 } = require('uuid');
var bodyParser = require('body-parser');
const { finished } = require("stream");

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

// Periodically update stats
var gamesPlayed = 0, gamesRunning = 0;
app.get('/stats', function(req, res) {
    res.status(200).send(JSON.stringify({
        'gamesPlayed': gamesPlayed,
        'gamesRunning': gamesRunning
    }));
});

const wss = new websocket.Server({server});

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

function startGame(gameUid) {
    var game = games.get(gameUid);
    if (game.canStart() && game.start()) {
        for (const [color, playerUid] of game.getPlayerUidsAndColors()) {
            players.get(playerUid).send(JSON.stringify({
                'type': 'start',
                'gameUid': gameUid,
                'time': game.getTime(),
                'increment': game.getIncrement(),
                'side': color
            }));
        }
        gamesRunning++;
        console.log('game ', gameUid, ' started');
        return true;
    }
    console.log('game ', gameUid, ' failed to start');
    return false;
}

function finishGame(gameUid) {
    var game = games.get(gameUid), state = game.getState();
    if (state != 'unresolved') {
        // Construct a message with result details
        var message = {
            'type': 'finished'
        }
        if (state == 'abandoned') 
            message.result = 'abandoned'
        else {
            gamesPlayed++;
            gamesRunning--;
            if (state == 'stalemate') {
                message.result = 'stalemate',
                message.winner = 'none'
            } else {
                message.result = 'checkmate',
                message.winner = state
            }
        }

        // Send the message to all players
        var finishedPlayers = game.getPlayerUids();
        for (var playerUid of finishedPlayers) {
            var connection = players.get(playerUid);
            if (connection)
                connection.send(JSON.stringify(message));
        }

        // Remove the game from the games list
        console.log('finished ', gameUid, ' - ', message);
        games.delete(gameUid);
    }
}

wss.on("connection", function connection(ws, req) {
    ws.uid = uuidv4();
    players.set(ws.uid, ws);
    console.log('new connection - ', ws.uid);

    setTimeout(function() {

    })
    
    ws.on('message', function incoming(jsonMessage) {
        var message = JSON.parse(jsonMessage);
        console.log('new message ', message);

        switch (message.type) {
            // Create a new game
            case 'create':
                var gameUid = uuidv4();
                console.log(message.time, message.increment, message.side);
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
                if (game.getState() == 'unresolved' && ws.uid == game.getCurrentPlayerUid() && game.attemptMove(message)) {
                    // Affirm the move was successful
                    var playerUids = game.getPlayerUids();
                    for (var playerUid of playerUids) {
                        if (players.get(playerUid))
                            players.get(playerUid).send(
                                JSON.stringify({
                                'type': 'move',
                                'moved': 'yes',
                                'side': game.board.getCurrentPlayerColor(),
                                'from': message.from,
                                'to': message.to
                            }));
                    }

                    // Inform that the game ended
                    if (game.getState() != 'unresolved') 
                        finishGame(gameUid);
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
        console.log('end connection - ', ws.uid);

        for (var [gameUid, game] of games) {
            var playerSide = game.hasPlayer(ws.uid);
            if (playerSide) {
                game.playerAbandoned(playerSide);
                finishGame(gameUid);
                break;
            }
        }

        if (awaiting[0] == ws.uid)
            awaiting = [];
        players.delete(ws.uid);
    });
})