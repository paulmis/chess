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
            this.current = pos;
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

        // Moves a piece from one tile to another
        // This function doesn't check whether the move is valid
        movePiece(from, to) {
            if (this.hasPiece(from)) {
                console.log(from.x + ", " + from.y);
                console.log(to.x + ", " + to.y);
                this.getTile(to).setPiece(this.getTile(from).getPiece());
                this.getTile(from).deletePiece();
                move = (move == 'white' ? 'black' : 'white');
                this.current = null;
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
            console.log(this.tiles);
            console.log(parent);
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
        console.log("new:" + newPosition.x + "," + newPosition.y);

        if (currentPosition != null && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != move))
            board.movePiece(currentPosition, newPosition);
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == move)
            board.setCurrentPosition(newPosition);
    }
    boardDiv.addEventListener("click", onClick);
});