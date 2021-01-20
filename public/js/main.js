// @ts-check

const boardRows = 8, boardCols = 8;

document.addEventListener('DOMContentLoaded', () => {
    const boardDiv = document.querySelector('.board')
    const tiles = document.querySelector('.tiles')
    const pieces = document.querySelector('.pieces')

    // A class representing a position (point)
    class Position {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        add(other) {
            this.x += other.x;
            this.y += other.y;
        }

        addDeep(other) {
            return new Position(this.x + other.x, this.y + other.y);
        }

        manhattanDistance(other) {
            return Math.abs(other.x - this.x) + Math.abs(other.y - this.y);
        }

        getDirection(to) {
            return new Position(Math.sign(to.x - this.x), Math.sign(to.y - this.y));
        }
    }

    // A class representing a chess piece
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
            let piece = document.createElement('div');
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

        setPiece(piece) {
            this.deletePiece();

            // Copy and draw the new piece
            let tile = document.getElementById('tile' + this.row + this.col);
            this.piece = piece;
            this.piece.generateView(tile);
        }

        // Initializes the tile with a default piece
        initializeDefault() {
            this.piece = Piece.getInitialPiece(this.row, this.col);
        }

        // Generates HTML elements of the tile
        generateView(parent) {
            let tile = document.createElement('div');
            tile.setAttribute('class', 'tile ' + ((this.row * 9 + this.col) & 1 ? 'tile-white' : 'tile-black'));
            tile.setAttribute('id', 'tile' + this.row + this.col);
            parent.appendChild(tile);

            if (this.piece != null)
                this.piece.generateView(tile);
        }

        // Deletes the piece object and drawed elements
        deletePiece() {
            this.piece = null;
            let tile = document.getElementById('tile' + this.row + this.col);
            while (tile.firstChild)
                tile.removeChild(tile.lastChild);
        }

        enableHighlight() {
            let piece = document.getElementById('tile' + this.row + this.col).getElementsByTagName("*")[0];
            piece.classList.add('tile-highlighted');
        }

        static valid(pos) {
            return pos.x > 0 && pos.y > 0 && pos.x <= boardCols && pos.y <= boardRows;
        }
    }

    class Player {
        constructor(side) {
            this.side = side;
            this.kingMoved = false;
            this.hasCastled = false;
            this.lostPieces = [];
            this.moves = [];
        }
    
        getKingMoved() {
            return this.kingMoved;
        }

        setKingMoved() {
            this.kingMoved = true;
        }

        setHasCastled() {
            this.hasCastled = true;
        }
    }

    // A class representing a chess board
    class Board {
        constructor() {
            this.tiles = [];
            this.currentPosition = null;
            this.currentPlayerColor = 'white';
            this.players = {
                'white': new Player('white'),
                'black': new Player('black')
            };
        }

        getRows() {
            return this.tiles.length;
        }

        getCols() {
            if (this.getRows() == 0) return 0;
            return this.tiles[0].length;
        }

        getCurrentPosition() {
            return this.currentPosition;
        }

        setCurrentPosition(pos) {
            if (this.currentPosition != null) this.disableHighlight();
            if (pos != null)                  this.getTile(pos).enableHighlight();
            this.currentPosition = pos;
        }

        disableHighlight() {
            let piece = document.querySelector('.tile-highlighted');
            if (piece)
                piece.classList.remove('tile-highlighted');
        }

        getTile(pos) {
            return this.tiles[pos.y - 1][pos.x - 1];
        }

        getPiece(pos) {
            return this.getTile(pos).getPiece();
        }

        hasPiece(pos, type) {
            var piece = this.getPiece(pos);
            return piece != null && (typeof type === "undefined" ? true : piece.getType() == type);
        }

        getCurrentPlayerColor() {
            return this.currentPlayerColor;
        }

        getCurrentPlayer() {
            return this.players[this.currentPlayerColor];
        }

        // Returns the manhattan distance to the first element met by iteratively
        // applying the change vector to the starting position, or null if none is met
        lineScan(start, change) {
            // Scan the lane following the specified change
            console.log("start:", start, change);
            var next = start.addDeep(change), it = 0;
            while (Tile.valid(next) && !this.hasPiece(next))
                next.add(change);
            console.log("end:", next);
            // Return the value
            if (!Tile.valid(next)) return null;
            return {
                'distance': start.manhattanDistance(next),
                'piece': this.getPiece(next)
            };
        }

        // Checks whether there is not a piece between from and to on a straight line
        // The line between from and to must be either parallel or diagonal to the board
        lineMoveNotObstructed(from, to) {
            var scanResult = this.lineScan(from, from.getDirection(to));
            console.log(scanResult);
            return scanResult == null || scanResult.distance >= from.manhattanDistance(to);
        }
        
        // Checks whether the move is valid
        // TODO: cleanup, checks, castles, en passant
        validateMove(from, to) {
            if (from.x == to.x && from.y == to.y || !Tile.valid(to))
                return false;
            
            let piece = this.getPiece(from);
            let color = piece.getColor();
            let dx = to.x - from.x, dy = to.y - from.y;
            let adx = Math.abs(dx), ady = Math.abs(dy);
            switch (piece.getType()) {
                case 'pawn':
                    if (color == 'white') 
                    {
                        if (this.hasPiece(to))
                            return Math.abs(to.x - from.x) <= 1 && to.y == from.y + 1;
                        return to.x == from.x && to.y > from.y && to.y <= from.y + 1 + (from.y == 2 ? 1 : 0);
                    } else {
                        if (this.hasPiece(to))
                            return Math.abs(to.x - from.x) <= 1 && to.y == from.y - 1;
                        return to.x == from.x && to.y < from.y && to.y >= from.y - 1 - (from.y == 7 ? 1 : 0);
                    }
                case 'knight':
                    return adx + ady == 3 && (adx == 1 || adx == 2);
                case 'bishop':
                    if (adx != ady) return false;
                    return this.lineMoveNotObstructed(from, to);
                case 'rook':
                    if (adx > 0 && ady > 0) return false;
                    return this.lineMoveNotObstructed(from, to);
                case 'king':
                    if (adx <= 1 && ady <= 1) return true;

                    // Check if castle conditions are met
                    var rookPosition = new Position(dx < 0 ? 1 : 8, from.y);
                    if (this.getCurrentPlayer().getKingMoved() || ady != 0 || adx != 2 || !this.hasPiece(rookPosition, 'rook'))
                        return false;
                    return this.lineMoveNotObstructed(rookPosition, from);
                case 'queen':
                    if (adx != ady && adx != 0 && ady != 0) return false;
                    return this.lineMoveNotObstructed(from, to);
                default:
                    console.error("validateMove: default case");
                    return false;
            }
        }

        // Moves a piece from one tile to another
        // This function doesn't check whether the move is valid
        movePiece(from, to) {
            if (this.hasPiece(from) && this.validateMove(from, to)) {
                // Move the piece
                var piece = this.getPiece(from);
                this.getTile(to).setPiece(piece);
                this.getTile(from).deletePiece();
                
                // Check for castle
                if (piece.getType() == 'king')
                {
                    this.getCurrentPlayer().setKingMoved();
                    if (Math.abs(from.x - to.x) == 2) {
                        var rookFrom = new Position(to.x - from.x > 0 ? 8 : 1, from.y);
                        var rookTo = new Position(to.x - from.x > 0 ? 6 : 4, from.y);
                        this.getTile(rookTo).setPiece(this.getPiece(rookFrom));
                        this.getTile(rookFrom).deletePiece();
                        this.getCurrentPlayer().setHasCastled();
                    }
                }

                // Set move variables
                this.currentPlayerColor = (this.currentPlayerColor == 'white' ? 'black' : 'white');
                this.setCurrentPosition(null);
            }
        }

        // Initializes the board with tiles and default pieces
        initializeDefault() {
            this.tiles = [];
            for (var row = 1; row <= boardRows; row++)
            {
                let tileRow = [];
                for (var col = 1; col <= boardCols; col++) {
                    tileRow.push(new Tile(row, col));
                    tileRow[tileRow.length - 1].initializeDefault();
                }
                this.tiles.push(tileRow);
            }
        }

        // Generates HTML elements of the board by appending
        // structures to the specified parent
        generateView(parent) {
            for (var row = this.getRows(); row > 0; row--)
                for (var col = 1; col <= this.getCols(); col++) {
                    this.tiles[row - 1][col - 1].generateView(parent);
                }
        }
    }

    // Generate a new board and initiate it with default pieces
    var board = new Board();
    board.initializeDefault();
    board.generateView(tiles);

    // Add the onclick function that allows players to move pieces
    function onClick(event) {
        let box = boardDiv.getBoundingClientRect();
        let currentPosition = board.getCurrentPosition();
        let newPosition = new Position(1 + Math.floor((event.clientX - box.x) / 80), 8 - Math.floor((event.clientY - box.y) / 80));

        console.log(currentPosition, newPosition, board.getCurrentPosition());

        if (currentPosition != null && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != board.getCurrentPlayerColor()))
            board.movePiece(currentPosition, newPosition);
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
            board.setCurrentPosition(newPosition);
    }
    boardDiv.addEventListener("click", onClick);
});