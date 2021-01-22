const socket = new WebSocket('ws://17b56118c5e2.eu.ngrok.io');
const boardDiv = document.querySelector('.board')
const tiles = document.querySelector('.tiles')
const pieces = document.querySelector('.pieces')

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(other) {
        return other != null && this.x == other.x && this.y == other.y;
    }
}

class Piece {
    constructor(color, type) {
        this.color = color;
        this.type = type;
    }

    getColor() {
        return this.color;
    }

    getType() {
        return this.type;
    }

    // Returns the piece default to a given position 
    static getInitialPiece(row, col) {
        let color = row > 4 ? 'black' : 'white';
        let type;

        // Get piece type
        if (row > 4) row = 9 - row;
        if (row == 2)
            type = 'pawn';
        else if (row == 1) {
            const figures = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
            type = figures[col - 1];
        }
        if (type == null) return null;
        return new Piece(color, type);
    }

    // Generates HTML elements of the piece
    generateView(tile) {
        var piece = document.createElement('div');
        piece.style.backgroundImage = 'url(\'img/pieces/' + this.color + '/' + this.type + '.svg\')';
        piece.setAttribute('class', 'piece');
        tile.appendChild(piece);
    }
}

// A class representing a chess tile
// Single tile can contain one or none pieces
class Tile {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.piece = null;
    }

    getPiece() {
        return this.piece;
    }

    getTileElement() {
        return document.getElementById('tile' + this.row + this.col);
    }

    // Initializes the tile with a default piece
    initializeDefault() {
        this.piece = Piece.getInitialPiece(this.row, this.col);
    }

    // Generates HTML elements of the tile
    generateView(parent, fileRow) {
        var tile = document.createElement('div');
        tile.setAttribute('class', 'tile ' + ((this.row * 9 + this.col) & 1 ? 'tile-white' : 'tile-black'));
        tile.setAttribute('id', 'tile' + this.row + this.col);
        parent.appendChild(tile);

        if (this.piece != null)
            this.piece.generateView(tile);

        // Generate file and rank tags
        if (this.row == fileRow)
        {
            var file = document.createElement('div');
            file.setAttribute('class', 'file');
            file.setAttribute('id', 'file' + this.row);
            file.textContent = String.fromCharCode(this.col + 96);
            tile.appendChild(file);
        }

        if (this.col == 8)
        {
            var rank = document.createElement('div');
            rank.setAttribute('class', 'rank');
            rank.setAttribute('id', 'rank' + this.col);
            rank.textContent = this.row;
            tile.appendChild(rank);
        }
    }

    // Adds the specified piece to the tile
    addPiece(piece) {
        if (this.piece != null)
            throw 'addPiece but piece already exists';
        this.piece = piece;
        this.piece.generateView(this.getTileElement());
    }

    // Deletes tile's piece
    deletePiece() {
        if (this.piece == null)
            throw 'deletePiece but piece doesn\'t exist';

        this.getTileElement().removeChild(this.getTileElement().firstChild);
        this.piece = null;
    }

    // Moves piece from this tile to another tile
    movePiece(other) {
        var pieceElement = document.getElementById('tile' + this.row + this.col).firstChild;
        other.acceptPiece(pieceElement, this.piece);
        this.piece = null;
    }

    // Accepts a piece moved from another tile
    acceptPiece(pieceElement, piece) {
        if (this.piece != null)
            this.deletePiece();
        this.piece = piece;
        this.getTileElement().prepend(pieceElement); 
    }

    // Highlights the piece
    enableHighlight() {
        let piece = document.getElementById('tile' + this.row + this.col).getElementsByTagName("*")[0];
        piece.classList.add('tile-highlighted');
    }

    // Removes the highlight
    disableHighlight() {
        let piece = document.querySelector('.tile-highlighted');
        if (piece)
            piece.classList.remove('tile-highlighted');
    }

    static valid(pos) {
        return pos.x > 0 && pos.y > 0 && pos.x <= 8 && pos.y <= 8;
    }
}

// A class representing a player
class Player {
    constructor(side) {
        this.side = side;
        this.kingMoved = false;
        this.hasCastled = false;
        this.lostPieces = [];
        this.moves = [];
        this.doublePawn = null;
    }

    getKingMoved() { return this.kingMoved; }
    setKingMoved() { this.kingMoved = true; }
    setHasCastled() { this.hasCastled = true; }
    getSide() { return this.side; }
}

class Board {
    constructor() {
        this.tiles = [];
        this.currentPosition = null;
        this.currentPlayerColor = 'white';
        this.players = {
            'white': new Player('white'),
            'black': new Player('black')
        };
        this.view = null;
    }

    getCurrentPosition() {
        return this.currentPosition;
    }

    setCurrentPosition(pos) {
        if (this.currentPosition != null) this.getTile(this.currentPosition).disableHighlight();
        if (pos != null)                  this.getTile(pos).enableHighlight();
        this.currentPosition = pos;
    }

    resetCurrentPosition() {
        this.setCurrentPosition(null);
    }

    getTile(pos) {
        return Tile.valid(pos) ? this.tiles[pos.y - 1][pos.x - 1] : null;
    }

    getPiece(pos) {
        var tile = this.getTile(pos);
        return tile == null ? null : tile.getPiece();
    }

    hasPiece(pos, type) {
        var piece = this.getPiece(pos);
        return piece != null && (typeof type === "undefined" ? true : piece.getType() == type);
    }

    hasEnemyPiece(pos, type) {
        var piece = this.getPiece(pos);
        return piece != null && piece.getColor() != this.currentPlayerColor && (typeof type === "undefined" ? true : piece.getType() == type);
    }

    // todo: oposite color
    hasFriendlyPiece(pos) {
        var piece = this.getPiece(pos);
        return piece != null && piece.getColor() == this.currentPlayerColor;
    }

    getCurrentPlayerColor() {
        return this.currentPlayerColor;
    }

    getOppositePlayerColor() {
        return this.currentPlayerColor == 'white' ? 'black' : 'white';
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerColor];
    }

    getOppositePlayer() {
        return this.players[this.getOppositePlayerColor()];
    }

    // Initializes the board with tiles and default pieces
    initializeDefault() {
        this.tiles = Array.from(Array(8), () => new Array(8));
        for (var row = 8; row > 0; row--)
            for (var col = 1; col <= 8; col++) {
                this.tiles[row - 1][col - 1] = new Tile(row, col);
                this.tiles[row - 1][col - 1].initializeDefault();
            }
    }

    // Generates HTML elements of the board by appending
    // structures to the specified parent
    generateView(parent, view) {
        while (parent.lastChild)
            parent.removeChild(parent.lastChild);

        this.view = view;
        if (this.view == 'white') {
            for (var row = 8; row > 0; row--)
                for (var col = 1; col <= 8; col++) 
                    this.tiles[row - 1][col - 1].generateView(parent, 1);
        } else {
            for (var row = 1; row <= 8; row++)
                for (var col = 1; col <= 8; col++) 
                    this.tiles[row - 1][col - 1].generateView(parent, 8);
        }
    }

    // Draws the change on the game screens
    physicalRemovePiece(pos) {
        if (!this.getPiece(pos))
            throw 'pieceRemove but the tile doesn\'t have a piece';
        this.getOppositePlayer().lostPieces.push(this.getPiece(pos));
        this.getTile(pos).deletePiece();
    }

    // Draws the change on the game screens
    physicalAddPiece(pos, piece) {
        if (this.getPiece(pos))
            throw 'piecePlace but the tile already has a piece';
        this.getTile(pos).addPiece(piece);
    }

    // Draws the change on the game screens
    physicalMovePiece(from, to) {
        if (!this.getPiece(from))
            throw 'pieceMove but the starting tile doesn\'t have a piece';
        if (this.hasPiece(to))
            this.getOppositePlayer().lostPieces.push(this.getPiece(to));
        this.getTile(from).movePiece(this.getTile(to));
    }


    movePiece(from, to) {
        // Clear the previous double pawn move, and if this is one, save it
        this.getCurrentPlayer().doublePawn = null;
        if (Math.abs(from.y - to.y) == 2 && this.getPiece(from).getType() == 'pawn')
            this.getCurrentPlayer().doublePawn = to;

        // If it's the king moving, save that information
        if (this.getPiece(from).getType() == 'king')
        {
            this.getCurrentPlayer().kingMoved = true;
            // If the move is a castle, move the rook first and set castle variables
            if (Math.abs(from.x - to.x) == 2)
            {
                this.getCurrentPlayer().hasCastled = true;
                this.physicalMovePiece(new Position(to.x == 7 ? 8 : 1, from.y), new Position(to.x == 7 ? 6 : 4, from.y));
            }
        }

        // If it's en passsant, delete the pawn next to the piece
        if (this.getPiece(from).getType() == 'pawn' && !this.getPiece(to) && Math.abs(to.x - from.x) == 1 && Math.abs(to.y - from.y) == 1)
            this.physicalRemovePiece(new Position(to.x, from.y));

        // Execute the move
        this.physicalMovePiece(from, to);

        // If it's a pawn promotion, delete the piece and replace it with a queen
        if (this.getPiece(to).getType() == 'pawn' && to.y == (this.getPiece(to).getColor() == 'white' ? 8 : 1)) {
            this.physicalRemovePiece(to);
            this.physicalAddPiece(to, new Piece(this.currentPlayerColor, 'queen'));
        }

        this.currentPlayerColor = this.getOppositePlayerColor();
        this.setCurrentPosition(null);
    }
}

// Add the onclick function that allows players to move pieces
let board = new Board();
let side = 'white';
let gameUid = null;
let time = null;
let increment = null;

function boardOnClick(event) {
    let box = boardDiv.getBoundingClientRect();
    let currentPosition = board.getCurrentPosition();
    var x = Math.floor((event.clientX - box.x) / 80), y = Math.floor((event.clientY - box.y) / 80);
    let newPosition = new Position(x + 1, board.view == 'white' ? 8 - y : 1 + y); 

    if (board.getCurrentPlayerColor() == side) {
        if (currentPosition != null) {
            if (side == board.getCurrentPlayerColor() && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != board.getCurrentPlayerColor())) {
                socket.send(JSON.stringify({
                    'type': 'move',
                    'gameUid': gameUid,
                    'from': {
                        'x': currentPosition.x,
                        'y': currentPosition.y
                    },
                    'to': {
                        'x': newPosition.x,
                        'y': newPosition.y
                    }
                }));
            }

            else if (board.hasPiece(newPosition)) {
                if (newPosition.equals(currentPosition)) board.resetCurrentPosition();
                else board.setCurrentPosition(newPosition);
            }
                
        }
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
            board.setCurrentPosition(newPosition);
    }
}

// Generate a new board and initiate it with default pieces
document.addEventListener('DOMContentLoaded', () => {
    board.initializeDefault();
    board.generateView(tiles, 'white');
});

// Get the join type and execute a request
if (localStorage.getItem('joinGame')) {
    socket.onopen = () => socket.send(JSON.stringify({
        'type': 'join'
    }))
} else {
    var message = {
        'type': 'create',
        'time': localStorage.getItem('gameTime'),
        'increment': localStorage.getItem('gameIncrement'),
        'side': localStorage.getItem('gameSide')
    }; // for whatever reason the onopen function cannot directrly capture localStorage
    socket.onopen = () => socket.send(JSON.stringify(message));
}

localStorage.removeItem('joinGame');
localStorage.removeItem('gameTime');
localStorage.removeItem('gameIncrement');
localStorage.removeItem('gameSide');

socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    console.log("RECIEVED ", message);
    switch (message.type) {
        case 'created':
            document.getElementById('general-message').innerHTML = 'waiting for another player to join...';
            break;
        case 'waiting':
            document.getElementById('general-message').innerHTML = 'waiting for another player to start a game...';
            break;
        case 'start':
            // If starting with black, reverse the board
            if (message.side == 'black') {
                side = message.side;
                board.generateView(tiles, side);
            }

            // Set time info
            time = message.time;
            increment = message.increment;
            document.getElementById('enemy-timer').innerHTML = time;
            document.getElementById('own-timer').innerHTML = time;
            document.getElementById('game-type').innerHTML = time + ' + ' + increment;

            // Set general info
            boardDiv.addEventListener("pieceMove", boardOnClick);
            document.getElementById('general-message').innerHTML = ''
            gameUid = message.gameUid;
            break;
        case 'move':
            if (message.moved == 'yes') 
                board.movePiece(new Position(message.from.x, message.from.y), new Position(message.to.x, message.to.y));
            break;
        case 'finished':
            document.getElementById('general-message').innerHTML = 'game finished - ' + message.winner + ' won!';
            boardDiv.removeEventListener("pieceMove", boardOnClick, { passive: true });
            break;   
        default:
            console.error('Unrecognized server message ', message.type); 
    }
}
