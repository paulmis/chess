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

    class ConditionedPosition {
        constructor(x, y, condition) {
            this.pos = new Position(x, y);
            this.condition = condition;
        }

        fulfilled(pos) {
            return this.condition(pos);
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

        // Same as getType, but if it's a pawn, then prepends piece's color
        getFullType() {
            if (this.type == 'pawn') return this.color + this.type;
            return this.type;
        }

        // Checks whether this piece is a line piece, i.e. can attack in a line
        isLine() {
            return ['rook', 'bishop', 'queen'].includes(this.type);
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

    class Array2D {
        constructor(rows, cols) {
            this.fields = [];
            for (var row = 0; row < rows; row++) {
                this.fields.push([]);
                for (var col = 0; col < cols; col++)
                    this.fields[this.fields.length - 1].push([]);
            }
        }

        get(pos) {
            return this.fields[pos.y - 1][pos.x - 1];
        }

        add(pos, value) {
            if (this.fields[pos.y - 1][pos.x - 1].filter(pos => pos.equals(value)) == 0) // temporary, use set instead
                this.fields[pos.y - 1][pos.x - 1].push(value);
        }

        remove(pos, value) {
            this.fields[pos.y - 1][pos.x - 1] = this.get(pos).filter(item => {return !item.equals(value)}); // has to be {return ...}
        }

        clear(pos) {
            this.fields[pos.y - 1][pos.x - 1] = [];
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
        generateView(parent) {
            var tile = document.createElement('div');
            tile.setAttribute('class', 'tile ' + ((this.row * 9 + this.col) & 1 ? 'tile-white' : 'tile-black'));
            tile.setAttribute('id', 'tile' + this.row + this.col);
            parent.appendChild(tile);

            if (this.piece != null)
                this.piece.generateView(tile);

            // Generate file and rank tags
            if (this.row == 1)
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

        static valid(pos) {
            return pos.x > 0 && pos.y > 0 && pos.x <= 8 && pos.y <= 8;
        }
    }

    class Player {
        constructor(side) {
            this.side = side;
            this.kingMoved = false;
            this.hasCastled = false;
            this.lostPieces = [];
            this.moves = [];
            this.doublePawn = null;
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
            this.attackedBy = new Array2D(8, 8);
            this.currentPosition = null;
            this.currentPlayerColor = 'white';
            this.players = {
                'white': new Player('white'),
                'black': new Player('black')
            };
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

        // Checks whether piece at the attacker's position is in a line with another position, i.e. it could
        // attack it in line (either diagonally or parallel to the board's sides)
        isInLineWith(attackerPos, anotherPos) {
            var attacker = this.getPiece(attackerPos);
            if (!attacker.isLine()) return false;

            var adx = Math.abs(attackerPos.x - anotherPos.x), ady = Math.abs(attackerPos.y - anotherPos.y);
            switch (attacker.getType()) {
                case 'rook': 
                    return adx == 0 || ady == 0;
                case 'bishop':
                    return adx == ady;
                case 'queen':
                    return adx == 0 || ady == 0 || adx == ady;
                default:
                    throw 'inLineWith default case';
            }
        }

        // Checks whether the enemy piece at the specified position has just double moved
        enemyDoubleMove(pos) {
            var doublePawn = this.getOppositePlayer().doublePawn;
            return doublePawn != null && doublePawn.equals(pos);
        }

        // Checks whether the king of a given color can castle by moving to the specified position
        canCastle(pos, color = this.currentPlayerColor) {
            var kingPos = this.getKingPosition(color), rookPos = new Position(pos.x == 7 ? 8 : 1, kingPos.y);
            if (this.getCurrentPlayer().kingMoved || Math.abs(kingPos.x - pos.x) != 2 || kingPos.y - pos.y != 0 || this.isChecked(color) || this.getPiece(kingPos).getColor() != color || !this.getPiece(rookPos) || this.getPiece(rookPos).getColor() != color)
                return false;

            // Make sure the tiles king passes through aren't threatened
            var dir = kingPos.getDirection(rookPos);
            do {
                kingPos.add(dir);
                if (this.getUnfriendlyAttacks(kingPos, color).length != 0 || this.hasPiece(kingPos))
                    return false;
            } while (!kingPos.equals(pos));

            return true;
        }

        pieceDirs = {
            'king': [],
            'knight': [],
            'pawn': [],
            'bishop': [new Position(-1, 1), new Position(-1, -1), new Position(1, 1), new Position(1, -1)],
            'rook': [new Position(-1, 0), new Position(1, 0), new Position(0, -1), new Position(0, 1)],
            'queen': [new Position(-1, 0), new Position(1, 0), new Position(0, -1), new Position(0, 1), new Position(-1, 1), new Position(-1, -1), new Position(1, 1), new Position(1, -1)]
        };
    
        pieceMoves = {
            'king': [new ConditionedPosition(-1, 0, Tile.valid), new ConditionedPosition(1, 0, Tile.valid), new ConditionedPosition(0, -1, Tile.valid), new ConditionedPosition(0, 1, Tile.valid), 
                     new ConditionedPosition(-1, 1, Tile.valid), new ConditionedPosition(-1, -1, Tile.valid), new ConditionedPosition(1, 1, Tile.valid), new ConditionedPosition(1, -1, Tile.valid),
                     new ConditionedPosition(-2, 0, (pos) => {return this.canCastle(pos);}), new ConditionedPosition(2, 0, (pos) => {return this.canCastle(pos);})],
            'knight': [new ConditionedPosition(1, 2, Tile.valid), new ConditionedPosition(1, -2, Tile.valid), new ConditionedPosition(-1, 2, Tile.valid), new ConditionedPosition(-1, -2, Tile.valid), 
                     new ConditionedPosition(2, 1, Tile.valid), new ConditionedPosition(2, -1, Tile.valid), new ConditionedPosition(-2, 1, Tile.valid), new ConditionedPosition(-2, -1, Tile.valid)],
            'whitepawn': [new ConditionedPosition(0, 1, (pos) => {return !this.hasFriendlyPiece(pos)}), new ConditionedPosition(0, 2, (pos) => {return !this.hasFriendlyPiece(pos) && !this.hasFriendlyPiece(new Position(pos.x, pos.y - 1)) && pos.y == 4}),
                        new ConditionedPosition(1, 1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y - 1)) && pos.y == 6)}), 
                        new ConditionedPosition(-1, 1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y - 1)) && pos.y == 6)})],
            'blackpawn': [new ConditionedPosition(0, -1, (pos) => {return !this.hasFriendlyPiece(pos)}), new ConditionedPosition(0, -2, (pos) => {return !this.hasFriendlyPiece(pos) && !this.hasFriendlyPiece(new Position(pos.x, pos.y + 1)) && pos.y == 5}),
                        new ConditionedPosition(1, -1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y + 1)) && pos.y == 3)}), 
                        new ConditionedPosition(-1, -1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y + 1)) && pos.y == 3)})],
            'bishop': [],
            'rook': [],
            'queen': []
        }

        // Returns all positions of unfriendly pieces attacking at a given position
        getUnfriendlyAttacks(pos, color = this.currentPlayerColor) {
            return this.attackedBy.get(pos).filter(pos => {return this.hasPiece(pos) && this.getPiece(pos).getColor() != color});
        }

        // Retrieves all legal moves (destinations) of the piece at specified position
        getLegalMoves(from) {
            var moves = [];
            // Account for directions
            var dirs = this.pieceDirs[this.getPiece(from).getType()];
            for (var dir of dirs) {
                var to = from.addDeep(dir);
                while (Tile.valid(to)) {
                    moves.push(to);
                    if (this.hasPiece(to))
                        break;
                    to = to.addDeep(dir);
                }
            }

            // Account for moves
            let offsets = this.pieceMoves[this.getPiece(from).getFullType()];
            for (var offset of offsets)
            {
                var to = from.addDeep(offset.pos);
                if (Tile.valid(to) && offset.condition(to))
                    moves.push(to);
            }

            return moves;
        }
        
        // Retrieves all legal moves and pawn's side attacks that aren't legal
        // when they don't contain an enemy piece
        getAttackMoves(from) {
            var piece = this.getPiece(from);
            if (piece.getType() != 'pawn')
            {
                // If the piece is a king, filter out the castle moves
                if (piece.getType() == 'king') 
                    return this.getLegalMoves(from).filter(to => {return Math.abs(this.getKingPosition(this.currentPlayerColor).x - to.x) < 2;});
                return this.getLegalMoves(from);
            }
            
            var mul = (piece.getColor() == 'white' ? 1 : -1);
            return [new Position(from.x + 1, from.y + 1 * mul), new Position(from.x - 1, from.y + 1 * mul)].filter(to => Tile.valid(to)); // here no {} works
        }

        // Initiates the piece's attacks' table
        initPieceAttacks(attackerPos) {
            var attackMoves = this.getAttackMoves(attackerPos);
            for (var defenderPos of attackMoves)
                this.attackedBy.add(defenderPos, attackerPos);
        }

        // Deinitializes piece's attacks' table
        deinitPieceAttacks(attackerPos) {
            var attackMoves = this.getAttackMoves(attackerPos);
            var piece = this.getPiece(attackerPos);
            for (var defenderPos of attackMoves)
                this.attackedBy.remove(defenderPos, attackerPos);
        }

        // Initializes all attacks on board
        initAttacks() {
            var piecePositions = this.getAllPiecePositions();
            for (var pos of piecePositions)
                this.initPieceAttacks(pos);
        }

        physicalRemovePiece(pos) {
            if (!this.getPiece(pos))
                throw 'pieceRemove but the tile doesn\'t have a piece';

            this.deinitPieceAttacks(pos);
            var affected = this.attackedBy.get(pos).filter(pos => this.getPiece(pos).isLine());
            for (var apos of affected)
                this.deinitPieceAttacks(apos);
            this.getOppositePlayer().lostPieces.push(this.getPiece(pos));
            this.getTile(pos).deletePiece();
            for (var apos of affected)
                this.initPieceAttacks(apos);
        }

        physicalAddPiece(pos, piece) {
            if (this.getPiece(pos))
                throw 'piecePlace but the tile already has a piece';

            var affected = this.attackedBy.get(pos).filter(pos => this.getPiece(pos).isLine());
            for (var apos of affected)
                this.deinitPieceAttacks(apos);
            this.getTile(pos).addPiece(piece);
            this.initPieceAttacks(pos);
            for (var apos of affected)
                this.initPieceAttacks(apos);
        }

        physicalMovePiece(from, to) {
            if (!this.getPiece(from))
                throw 'pieceMove but the starting tile doesn\'t have a piece';
            
            var affected = this.attackedBy.get(from).filter(pos => this.getPiece(pos).isLine());
        
            if (this.getPiece(to)) this.getOppositePlayer().lostPieces.push(this.getPiece(to));
            else                   affected.push(...this.attackedBy.get(to).filter(pos => this.getPiece(pos).isLine() && !pos.equals(from)));

            this.deinitPieceAttacks(from);
            for (var apos of affected)
                this.deinitPieceAttacks(apos);
            this.getTile(from).movePiece(this.getTile(to));
            this.initPieceAttacks(to);
            for (var apos of affected)
                this.initPieceAttacks(apos);
        }

        // Retrieves positions of all pieces of the specified color
        // If the color is null, retrieves positions of all colors
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

        // Retrieves the position of all of the attackers of the specified color's king
        getKingAttackers(color) {
            return this.getUnfriendlyAttacks(this.getKingPosition(color), color);
        }

        // Checks whether the king of the specified color is in check or not
        isChecked(color) {
            return this.getKingAttackers(color).length != 0;
        }

        // Accepts the specified move if it wouldn't end the turn checking the player itself
        // This function doesn't check whether the move is valid or even whether the piece exists
        pieceCanMove(from, to) {
            // Check if moving the piece is pinned
            if (this.hasPiece(to) && this.getPiece(to).getColor() == this.currentPlayerColor)
                return false;
            
            var blockedPieces = this.getUnfriendlyAttacks(from).filter(pos => this.getPiece(pos).isLine());
            for (var attackerPos of blockedPieces) {
                // If the attacker is a line piece, moving this piece might expose the king to a check
                if (!from.getDirection(to).equals(from.getDirection(attackerPos))) {
                    var scanResult = this.lineScan(attackerPos, attackerPos.getDirection(from), from);
                    if (scanResult.piece != null && scanResult.piece.getType() == 'king' && scanResult.piece.getColor() == this.currentPlayerColor)
                        return false;
                }
            }

            // If there isn't a check, the piece can move
            if (!this.isChecked(this.currentPlayerColor))
            {
                // If the piece is a king, it can't get into a checked position
                if (this.getPiece(from).getType() != 'king') return true;
                return this.getUnfriendlyAttacks(to, this.currentPlayerColor).length == 0;
            }
            
            // Otherwise, the check must be remedied
            var attackers = this.getKingAttackers(this.currentPlayerColor);
            // If there is more than one attacker, the king must run to an unchecked position
            if (attackers.length > 1)
                return this.getPiece(from).getType() == 'king' && this.getUnfriendlyAttacks(to, this.currentPlayerColor).length == 0;
            // Otherwise, the king can either run...
            if (this.getPiece(from).getType() == 'king') return this.getUnfriendlyAttacks(to, this.currentPlayerColor).length == 0; 
            // ... the attacking piece can be taken...
            if (attackers[0].equals(to)) return true;
            // ... or the piece can block the incoming attack. This will happen if the attacker is a line piece,
            // the and the move will put the piece inbetween the king and the attacker
            var kingPosition = this.getKingPosition(this.currentPlayerColor);
            return this.getPiece(attackers[0]).isLine() && this.isInLineWith(attackers[0], to) && 
                Math.sign(attackers[0].x - kingPosition.x) == Math.sign(to.x - kingPosition.x) &&
                Math.sign(attackers[0].y - kingPosition.y) == Math.sign(to.y - kingPosition.y) &&
                kingPosition.manhattanDistance(to) < kingPosition.manhattanDistance(attackers[0]);
        }

        // Retrieve the moves of all pieces
        getPieceMoves(pos) {
            var moves = [];
            if (this.hasPiece(pos)) {
                var legalMoves = this.getLegalMoves(pos);
                for (var to of legalMoves) {
                    if (this.pieceCanMove(pos, to))
                        moves.push(to);
                }
            }
            return moves;
        }

        // Returns moves of all pieces of the specified color
        getAllPieceMoves(color) {
            var moves = [], piecePositions = this.getAllPiecePositions(color);
            for (var pos of piecePositions) {
                var pieceMoves = this.getPieceMoves(pos);
                if (pieceMoves.length > 0) {
                    moves.push({
                        'pos': pos, 
                        'moves': pieceMoves
                    });
                }
            }
            return moves;
        }

        // Returns the game state: unresolved, stalemate, or the winner
        calculateGameState() {
            if (this.getAllPieceMoves(this.currentPlayerColor).length == 0) {
                if (this.isChecked(this.currentPlayerColor)) return this.getOppositePlayerColor();
                return 'stalemate';
            }
            return 'unresolved';
        }

        // Moves a piece from one tile to another
        // This function doesn't check whether the move is valid
        movePiece(from, to) {
            var legalMoves = this.getLegalMoves(from);
            if (legalMoves.filter(move => move.equals(to)).length != 0 && this.pieceCanMove(from, to)) {
                // If a piece is taken, push it to the lost pieces list
                if (this.hasPiece(to)) 
                    this.getOppositePlayer().lostPieces.push(this.getPiece(to));
                
                // Clear the previous double pawn move, and if this is one, save it
                this.getCurrentPlayer().doublePawn = null;
                if (Math.abs(from.y - to.y) == 2 && this.getPiece(from).getType() == 'pawn')
                    this.getCurrentPlayer().doublePawn = to;

                // If it's the king moving, save that information
                if (this.getPiece(from).getType() == 'king')
                {
                    this.getCurrentPosition().kingMoved = true;
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
                this.currentPlayerColor = this.getOppositePlayerColor();
                this.setCurrentPosition(null);
            }
                
        }

        // Initializes the board with tiles and default pieces
        initializeDefault() {
            this.tiles = Array.from(Array(8), () => new Array(8));
            for (var row = 8; row > 0; row--)
                for (var col = 1; col <= 8; col++) {
                    this.tiles[row - 1][col - 1] = new Tile(row, col);
                    this.tiles[row - 1][col - 1].initializeDefault();
                }

            this.initAttacks();
        }

        // Generates HTML elements of the board by appending
        // structures to the specified parent
        generateView(parent) {
            for (var row = 8; row > 0; row--)
                for (var col = 1; col <= 8; col++) {
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
            var gameState = board.calculateGameState();
            if (gameState != 'unresolved')
                window.alert(gameState);
        }
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
            board.setCurrentPosition(newPosition);
    }

    
    boardDiv.addEventListener("click", onClick);
});