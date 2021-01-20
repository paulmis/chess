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

        equals(other) {
            return other != null && this.x == other.x && this.y == other.y;
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
        hasFriendlyPiece(pos, type) {
            var piece = this.getPiece(pos);
            return piece != null && piece.getColor() == this.currentPlayerColor && (typeof type === "undefined" ? true : piece.getType() == type);
        }

        getCurrentPlayerColor() {
            return this.currentPlayerColor;
        }

        getCurrentPlayer() {
            return this.players[this.currentPlayerColor];
        }

        // Returns the position of the king of a specified color
        getKingPosition(color) {
            for (var col = 1; col <= 8; col++)
                for (var row = 1; row <= 8; row++) {
                    var pos = new Position(row, col);
                    var piece = this.getPiece(pos);
                    if (piece != null && piece.getType() == 'king' && piece.getColor() == color)
                        return pos;
                }

            throw 'There isn\'t a king on the board!';
        }

        // Returns the manhattan distance to the first element met by iteratively
        // applying the change vector to the starting position, or null if none is met
        lineScan(start, change, skip = null) {
            // Scan the lane following the specified change
            var next = start.addDeep(change), it = 0;
            while (Tile.valid(next) && (next.equals(skip) || !this.hasPiece(next)))
            {
                next.add(change);
            }
            return {
                'distance': start.manhattanDistance(next),
                'piece': !Tile.valid(next) ? null : this.getPiece(next)
            };
        }

        // Checks whether there is not a piece between from and to on a straight line
        // The line between from and to must be either parallel or diagonal to the board
        lineMoveNotObstructed(from, to) {
            var scanResult = this.lineScan(from, from.getDirection(to));
            return scanResult.piece == null || scanResult.distance >= from.manhattanDistance(to);
        }

        getAllPiecePositions(color = null) {
            var piecePositions = [];
            for (var row = 1; row <= 8; row++)
                for (var col = 1; col <= 8; col++) {
                    var pos = new Position(col, row);
                    if (this.hasPiece(pos) && (color == null || this.getPiece(pos).getColor() == color))
                        piecePositions.push(pos);
                }
            
            return piecePositions;
        }

        isAtttackedBy(attackerPosition, defenderPositon) {
            var attackerPiece = this.getPiece(attackerPosition);
            var dx = defenderPositon.x - attackerPosition.x, dy = defenderPositon.y - attackerPosition.y;
            var adx = Math.abs(dx), ady = Math.abs(dy);

            switch (attackerPiece.getType()) {
                case 'pawn':
                    return adx == 1 && dy == (attackerPiece.getColor() == 'whtie' ? 1 : -1);
                case 'knight':
                    return adx + ady == 3 && (adx == 1 || adx == 2);
                case 'bishop':
                    if (adx != ady) return false;
                    return this.lineMoveNotObstructed(attackerPosition, defenderPositon);
                case 'rook':
                    if (adx > 0 && ady > 0) return false;
                    return this.lineMoveNotObstructed(attackerPosition, defenderPositon);
                case 'queen':
                    if (adx != ady && adx != 0 && ady != 0) return false;
                    return this.lineMoveNotObstructed(attackerPosition, defenderPositon);
                case 'king':
                    return adx <= 1 && ady <= 1;
                default:
                    throw 'isAttackedBy default case';
            }
        }

        // Checks whether a given position is attcked by the enemy
        isAttacked(defenderPosition, defenderColor) {
            var attackerPositions = this.getAllPiecePositions(defenderColor == 'white' ? 'black' : 'white');
            for (var attackerPosition of attackerPositions) {
                if (this.isAtttackedBy(attackerPosition, defenderPosition))
                    return true;
            }
            return false;
        }

        getAttackers(defenderPosition) {
            var piece = this.getPiece(defenderPosition);
            var attackerPositions = this.getAllPiecePositions(piece.getColor() == 'white' ? 'black' : 'white');
            var attackers = [];
            for (var attackerPosition of attackerPositions) {
                if (this.isAtttackedBy(attackerPosition, defenderPosition))
                    attackers.push(attackerPosition);
            }
            return attackers;
        }

        // Checks whether the specified color's king is under attack, i.e. checked
        isChecked(color) {
            return this.isAttacked(this.getKingPosition(color), color);
        }

        // Checks whether the move is trivially valid, that is if a given piece can move
        // to the specified tile in the fashion specified by its type and whether it's
        // blocked by any pieces
        // TODO: en passant
        trivialValidateMove(from, to) {
            if (from.x == to.x && from.y == to.y || !Tile.valid(to))
                return false;
            
            let dx = to.x - from.x, dy = to.y - from.y;
            let adx = Math.abs(dx), ady = Math.abs(dy);

            switch (this.getPiece(from).getType()) {
                case 'pawn':
                    if (this.getPiece(from).getColor() == 'white') 
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
                case 'queen':
                    if (adx != ady && adx != 0 && ady != 0) return false;
                    return this.lineMoveNotObstructed(from, to);
                case 'king':
                    if (adx <= 1 && ady <= 1) return true;

                    // Check if castle conditions are met
                    var rookPosition = new Position(dx < 0 ? 1 : 8, from.y);
                    if (this.getCurrentPlayer().getKingMoved() || ady != 0 || adx != 2 || !this.hasFriendlyPiece(rookPosition, 'rook'))
                        return false;
                    return this.lineMoveNotObstructed(rookPosition, from);
                default:
                    console.error("validateMove default case");
                    return false;
            }    
        }
 
        // Checks whether a particular move exposes player's king to an attack, i.e. checks
        // Assumes the king isn't already checked
        moveExposesKing(from, to) {
            var piece = this.getPiece(from);
            if (piece.getType() == 'king')
                return this.isAttacked(to, piece.getColor());

            var kingPosition = this.getKingPosition(this.currentPlayerColor);
            var dx = kingPosition.x - from.x, dy = kingPosition.y - from.y;
            var adx = Math.abs(dx), ady = Math.abs(dy);

            if (adx != 0 && ady != 0 && adx != ady)
                return false;
            var attacker = this.lineScan(kingPosition, kingPosition.getDirection(from), from);
            if (attacker.piece == null || attacker.piece.getColor() == this.currentPlayerColor)
                return false;
            switch (attacker.piece.getType()) {
                case 'pawn':
                case 'knight':
                    return false;
                case 'rook':
                    return adx == 0 || ady == 0;
                case 'bishop':
                    return adx == ady;
                case 'queen':
                    return true;
                default:
                    throw 'moveExposesKing default case';
            }
        }

        listAllPieceMoves(pos) {
            var piece = this.getPiece(pos), moves = [];
            switch (piece.getType()) {
                case 'pawn':
                    var sign = piece.getColor() == 'white' ? 1 : -1;
                    if (!this.hasPiece(new Position(pos.x, pos.y + sign * 1))) {
                        moves.push(new Position(pos.x, pos.y + sign * 1));
                        if (!this.hasPiece(new Position(pos.x, pos.y + sign * 2)) && pos.y == (piece.getColor() == 'white' ? 2 : 7))
                            moves.push(new Position(pos.x, pos.y + sign * 2));
                    }

                    if (this.hasEnemyPiece(new Position(pos.x - 1, pos.y + sign * 1)))
                        moves.push(new Position(pos.x - 1, pos.y + sign * 1));
                    if (this.hasEnemyPiece(new Position(pos.x + 1, pos.y + sign * 1)))
                        moves.push(new Position(pos.x + 1, pos.y + sign * 1));
                    break;
                case 'knight':
                    const knightOffsets = [new Position(1, 2), new Position(1, -2), new Position(-1, 2), new Position(-1, -2), new Position(2, 1), new Position(2, -1), new Position(-2, 1), new Position(-2, -1)];
                    for (var offset of knightOffsets) {
                        var newPos = pos.addDeep(offset);
                        if (Tile.valid(newPos) && !this.hasFriendlyPiece(newPos))
                            moves.push(newPos);
                    }
                    break;
                case 'bishop':
                    const bishopDirections = [new Position(-1, 1), new Position(-1, -1), new Position(1, 1), new Position(1, -1)];
                    for (var dir of bishopDirections) {
                        var scanResult = this.lineScan(pos, dir);
                        var plus = scanResult.piece != null && scanResult.piece.getColor() != piece.getColor() ? 1 : 0;
                        for (var i = 1; i < scanResult.distance / 2 + plus; i++)
                            moves.push(new Position(pos.x + dir.x * i, pos.y + dir.y * i));
                    }
                    break;
                case 'rook':                     
                    const rookDirections = [new Position(-1, 0), new Position(1, 0), new Position(0, -1), new Position(0, 1)];
                    for (var dir of rookDirections) {
                        var scanResult = this.lineScan(pos, dir);
                        var plus = scanResult.piece != null && scanResult.piece.getColor() != piece.getColor() ? 1 : 0;
                        for (var i = 1; i < scanResult.distance / 2 + plus; i++)
                            moves.push(new Position(pos.x + dir.x * i, pos.y + dir.y * i));
                    }
                    break;
                case 'queen':
                    const queenDirections = [new Position(-1, 0), new Position(1, 0), new Position(0, -1), new Position(0, 1),new Position(-1, 1), new Position(-1, -1), new Position(1, 1), new Position(1, -1)];
                    for (var dir of queenDirections) {
                        var scanResult = this.lineScan(pos, dir);
                        var plus = scanResult.piece != null && scanResult.piece.getColor() != piece.getColor() ? 1 : 0;
                        var div = Math.abs(dir.x) + Math.abs(dir.y);
                        console.log("QUEEN ", dir, scanResult, plus, div);
                        for (var i = 1; i < scanResult.distance / div + plus; i++)
                            moves.push(new Position(pos.x + dir.x * i, pos.y + dir.y * i));
                    }
                    break;
                case 'king':
                    for (var dy = -1; dy <= 1; dy++)
                        for (var dx = -1; dx <= 1; dx++) {
                            if (Tile.valid(new Position(pos.x + dx, pos.y + dy)) && !this.hasFriendlyPiece(new Position(pos.x + dx, pos.y + dy)))
                                moves.push(new Position(pos.x + dx, pos.y + dy));
                        }
                    
                    if (!this.getCurrentPlayer().getKingMoved()) {
                        for (var rookX of [1, 8]) {
                            var rookPosition = new Position(rookX, pos.y);
                            if (!this.getCurrentPlayer().getKingMoved() && this.hasFriendlyPiece(rookPosition, 'rook') && this.lineMoveNotObstructed(rookPosition, pos))
                                moves.push(new Position(Math.sign(pos.x - rookX) * 2 + pos.x, pos.y));
                        }
                    }
                    break;
                default:
                    throw 'listAllPieceMoves default case';
            }

            var validatedMoves = [];
            console.log(pos, '\'s moves: ', moves);
            for (var to of moves) {
                if (this.trivialValidateMove(pos, to)) {
                    if (piece.getType() == 'king')
                    {
                        if (!this.moveExposesKing(pos, to))
                            validatedMoves.push(to);
                    }
                    else if (this.isChecked(this.currentPlayerColor)) {
                        var attackers = this.getAttackers(this.getKingPosition(this.currentPlayerColor));
                        console.log(piece, pos, to, ' to defeat ', attackers[0]);
                        if (attackers.length == 1 && to.equals(attackers[0]))
                            validatedMoves.push(to);
                    } else {
                        validatedMoves.push(to);
                    }
                } 
            }
            return validatedMoves;
        }

        listAllMoves(color) {
            var positions = this.getAllPiecePositions(color), moves = [];
            for (var pos of positions) {
                var newMoves = this.listAllPieceMoves(pos);
                if (newMoves.length != 0) {
                    moves.push({
                        'pos': pos,
                        'moves': newMoves
                    });
                }
            }

            return moves;
        }

        validateMove(from, to) {
            return this.trivialValidateMove(from, to) && !this.moveExposesKing(from, to);
        }

        // Moves a piece from one tile to another
        // This function doesn't check whether the move is valid
        movePiece(from, to) {
            var moves = this.listAllMoves(this.currentPlayerColor);
            console.log(from, to);
            for (var pieceMoves of moves) {
                if (pieceMoves.pos.equals(from))
                {
                    for (var move of pieceMoves.moves)
                    {
                        if (move.equals(to))
                        {
                            var piece = this.getPiece(from);
                            this.getTile(to).setPiece(piece);
                            this.getTile(from).deletePiece();
    
                            // Set move variables
                            this.currentPlayerColor = (this.currentPlayerColor == 'white' ? 'black' : 'white');
                            this.setCurrentPosition(null);
                            break;
                        }
                    }
                    break;
                }
            }

            /*
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
                }*/
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

        if (currentPosition != null && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != board.getCurrentPlayerColor()))
        {
            board.movePiece(currentPosition, newPosition);

            var moves = board.listAllMoves(board.currentPlayerColor);
            console.log(board.currentPlayerColor, '\'s moves', moves);
            console.log('is ', board.currentPlayerColor, ' checked?: ', board.isChecked(board.currentPlayerColor));
            if (board.isChecked(board.currentPlayerColor) && moves.length == 0) {
                window.alert('checkmate');
            }
            else if (!board.isChecked(board.currentPlayerColor) && moves.length == 0) {
                window.alert('stalemate');
            }
        }
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
            board.setCurrentPosition(newPosition);
    }
    boardDiv.addEventListener("click", onClick);
});