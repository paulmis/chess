// @ts-check

const boardRows = 8, boardCols = 8;
let move = 'white';

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
    }

    // A class representing a chess board
    class Board {
        constructor() {
            this.tiles = [];
            this.current = null;
        }

        getRows() {
            return this.tiles.length;
        }

        getCols() {
            if (this.getRows() == 0) return 0;
            return this.tiles[0].length;
        }

        getCurrentPosition() {
            return this.current;
        }

        setCurrentPosition(pos) {
            if (this.current != null) this.disableHighlight();
            if (pos != null)          this.getTile(pos).enableHighlight();
            this.current = pos;
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

        hasPiece(pos) {
            return this.getPiece(pos) != null;
        }

        // Checks whether the move is valid
        // TODO: cleanup, checks, castles, en passant
        validateMove(from, to) {
            if (from.x == to.x && from.y == to.y)
                return false;
            if (to.x <= 0 || to.x > 8 || to.y <= 0 || to.y > 8)
                return false;
            
            let piece = this.getPiece(from);
            let color = piece.getColor();
            console.log(from, to);
            let dx = to.x - from.x, dy = to.y - from.y;
            let adx = Math.abs(dx), ady = Math.abs(dy);
            switch (piece.getType()) {
                case 'pawn':
                    if (color == 'white') 
                    {
                        console.log(Math.abs(to.x - from.x), from.y + 1 + (from.y == 2 ? 1 : 0));
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
                    var rayPosition = new Position(from.x + Math.sign(dx), from.y + Math.sign(dy));
                    while (rayPosition.x != to.x) {
                        if (this.hasPiece(rayPosition))
                            return false;
                        rayPosition.x += Math.sign(dx);
                        rayPosition.y += Math.sign(dy);
                    }
                    return true;
                case 'rook':
                    if (adx > 0 && ady > 0) return false;
                    var rayPosition = new Position(from.x + Math.sign(dx), from.y + Math.sign(dy));
                    while (rayPosition.x != to.x || rayPosition.y != to.y) {
                        console.log(rayPosition);
                        if (this.hasPiece(rayPosition))
                            return false;
                        rayPosition.x += Math.sign(dx);
                        rayPosition.y += Math.sign(dy);
                    }
                    return true;
                case 'king':
                    return adx <= 1 && ady <= 1;
                case 'queen':
                    if (adx != ady && adx != 0 && ady != 0) return false;
                    var rayPosition = new Position(from.x + Math.sign(dx), from.y + Math.sign(dy));
                    if (adx == ady) {
                        while (rayPosition.x != to.x) {
                            if (this.hasPiece(rayPosition))
                                return false;
                            rayPosition.x += Math.sign(dx);
                            rayPosition.y += Math.sign(dy);
                        }
                    } else {
                        while (rayPosition.x != to.x || rayPosition.y != to.y) {
                            console.log(rayPosition);
                            if (this.hasPiece(rayPosition))
                                return false;
                            rayPosition.x += Math.sign(dx);
                            rayPosition.y += Math.sign(dy);
                        }
                        return true;
                    }
                default:
                    return true;
            }
        }

        // Moves a piece from one tile to another
        // This function doesn't check whether the move is valid
        movePiece(from, to) {
            if (this.hasPiece(from) && this.validateMove(from, to)) {
                this.getTile(to).setPiece(this.getTile(from).getPiece());
                this.getTile(from).deletePiece();
                move = (move == 'white' ? 'black' : 'white');
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

        if (currentPosition != null && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != move))
            board.movePiece(currentPosition, newPosition);
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == move)
            board.setCurrentPosition(newPosition);
    }
    boardDiv.addEventListener("click", onClick);
});