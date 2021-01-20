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
            console.log('remove ', value, ' from ', pos, ', lookup: ', this.fields[pos.y - 1][pos.x - 1]);
            this.fields[pos.y - 1][pos.x - 1] = this.get(pos).filter(item => !item.equals(value));
            console.log('after: ', typeof this.fields[pos.y - 1][pos.x - 1]);
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

        clearPieceView() {
            
        }

        movePiece(other) {
            var pieceElement = document.getElementById('tile' + this.row + this.col).firstChild;
            other.acceptPiece(pieceElement, this.piece);
            this.piece = null;
        }

        acceptPiece(pieceElement, piece) {
            let tile = document.getElementById('tile' + this.row + this.col);
            if (this.piece != null)
                tile.removeChild(tile.firstChild);
            this.piece = piece;
            tile.prepend(pieceElement); 
        }

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
            this.attacks = new Array2D(8, 8);
            this.blocks = new Array2D(8, 8);
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
                     new ConditionedPosition(-1, 1, Tile.valid), new ConditionedPosition(-1, -1, Tile.valid), new ConditionedPosition(1, 1, Tile.valid), new ConditionedPosition(1, -1, Tile.valid)],
            'knight': [new ConditionedPosition(1, 2, Tile.valid), new ConditionedPosition(1, -2, Tile.valid), new ConditionedPosition(-1, 2, Tile.valid), new ConditionedPosition(-1, -2, Tile.valid), 
                     new ConditionedPosition(2, 1, Tile.valid), new ConditionedPosition(2, -1, Tile.valid), new ConditionedPosition(-2, 1, Tile.valid), new ConditionedPosition(-2, -1, Tile.valid)],
            'whitepawn': [new ConditionedPosition(0, 1, (pos) => {return !this.hasFriendlyPiece(pos)}), new ConditionedPosition(0, 2, (pos) => {return !this.hasFriendlyPiece(pos) && !this.hasFriendlyPiece(new Position(pos.x, pos.y - 1)) && pos.y == 4}),
                        new ConditionedPosition(1, 1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y - 1)) && pos.y == 5)}), 
                        new ConditionedPosition(-1, 1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y - 1)) && pos.y == 5)})],
            'blackpawn': [new ConditionedPosition(0, -1, (pos) => {return !this.hasFriendlyPiece(pos)}), new ConditionedPosition(0, -2, (pos) => {return !this.hasFriendlyPiece(pos) && !this.hasFriendlyPiece(new Position(pos.x, pos.y + 1)) && pos.y == 5}),
                        new ConditionedPosition(1, -1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y + 1)) && pos.y == 4)}), 
                        new ConditionedPosition(-1, -1, (pos) => {return this.hasEnemyPiece(pos) || (this.enemyDoubleMove(new Position(pos.x, pos.y + 1)) && pos.y == 4)})],
            'bishop': [],
            'rook': [],
            'queen': []
        }

        // Returns all positions of unfriendly pieces attacking at a given position
        getUnfriendlyAttacks(pos, color) {
            return this.attacks.get(pos).filter(pos => this.hasPiece(pos) && this.getPiece(pos).getColor() != color);
        }

        // Retrieves all legal moves (destinations) of the piece at specified position
        getLegalMoves(pos) {
            var moves = [];
            // Account for directions
            console.log('getLegalMoves ', pos);
            for (var dir of this.pieceDirs[this.getPiece(pos).getType()]) {
                var to = pos.addDeep(dir);
                while (Tile.valid(to)) {
                    moves.push(to);
                    if (this.hasPiece(to))
                        break;
                    to = to.addDeep(dir);
                }
            }

            // Account for moves
            let offsets = this.pieceMoves[this.getPiece(pos).getFullType()];
            for (var offset of offsets)
            {
                var to = pos.addDeep(offset.pos);
                var c = offset.condition;
                if (Tile.valid(to) && c(to))
                    moves.push(to);
            }
            return moves;
        }

        // Initiates the piece's attacks' table
        initPieceAttacks(attackerPos) {
            var legalMoves = this.getLegalMoves(attackerPos);
            var attackerIsLine = this.getPiece(attackerPos).isLine();
            for (var defenderPos of legalMoves) {
                this.attacks.add(defenderPos, attackerPos);
                if (this.hasPiece(defenderPos) && attackerIsLine)
                    this.blocks.add(defenderPos, attackerPos);
            }
        }

        // Initializes all attacks on board
        initAttacks() {
            var piecePositions = this.getAllPiecePositions();
            for (var pos of piecePositions)
                this.initPieceAttacks(pos);
        }

        executeMove(from, to) {
            // If a piece is taken, push it to the lost pieces list
            if (this.hasPiece(to)) {
                this.getOppositePlayer().lostPieces.push(this.getPiece(to));
            }
            
            // Clear the previous double pawn move, and if this is one, save it
            this.getCurrentPlayer().doublePawn = null;
            if (Math.abs(from.y - to.y) == 2 && this.getPiece(from) == 'pawn')
                this.getCurrentPlayer().doublePawn = to;
            
            // Move the piece 'physically' and turn variables
            this.getTile(from).movePiece(this.getTile(to));
            this.currentPlayerColor = this.getOppositePlayerColor();
            this.setCurrentPosition(null);
        }

        // Recalculates the attacks and blocks and executed the move
        recalculateAttacks(attackerOldPos, attackerNewPos) {
            // Remove current attacks
            console.log('recalculateAttacks ', attackerOldPos, attackerNewPos);
            var oldLegalMoves = this.getLegalMoves(attackerOldPos), attackerIsLine = this.getPiece(attackerOldPos).isLine();
            for (var defenderPos of oldLegalMoves) {
                this.attacks.remove(defenderPos, attackerOldPos);
                if (this.hasPiece(defenderPos) && attackerIsLine)
                    this.blocks.remove(defenderPos, attackerOldPos)
            }
            
            // Position of the attacker changes, some pieces' attacks might get unblocked
            var unblockedAttackers = [];
            if (!attackerOldPos.equals(attackerNewPos)) {
                // Recalculate attacks of all positions blocked by the attacker's position
                // and remove all blockers (as there isn't a piece blocking anything anymore)
                unblockedAttackers = this.blocks.get(attackerOldPos);
                this.blocks.clear(attackerOldPos);

                // If the new position is occupied, the occupying piece is taken, hence
                // its attacks have to be removed. Since the attacker takes the occupied
                // position, blocks don't change
                if (this.hasPiece(attackerNewPos)) {
                    var oldAttackerLegalMoves = this.getLegalMoves(attackerNewPos);
                    for (var defenderPos of oldAttackerLegalMoves)
                        this.attacks.remove(defenderPos, attackerNewPos);
                }

                // Execute the move
                this.executeMove(attackerOldPos, attackerNewPos);
            }

            // Initialize attackers' attacks on its new position
            this.initPieceAttacks(attackerNewPos);
            console.log('recalculateAttacks initiated piece attacks');

            // Now that the piece is moved, the unblocked positions can recalculate their attacks
            console.log('recalculateAttacks recurse');
            for (var unblockedAttacker of unblockedAttackers)
                this.recalculateAttacks(unblockedAttacker, unblockedAttacker);
            console.log('recalculateAttacks exit');
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
            
            var blockedPieces = this.blocks.get(from);
            console.log('pieceCanMove (', from , ', ', to, ') - start');
            console.log('blocked: ', blockedPieces);
            for (var attackerPos of blockedPieces) {
                // If the attacker is in line with the blocking piece, and the scan from the attacker
                // to the blocking piece (skipping the blocking piece) hits the king, the piece is pinned
                if (this.getPiece(attackerPos).getColor() != this.currentPlayerColor && this.isInLineWith(attackerPos, from)) {
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
            console.log('movePiece ', from, to, legalMoves.filter(move => move.equals(to)).length != 0, this.pieceCanMove(from, to));
            if (legalMoves.filter(move => move.equals(to)).length != 0 && this.pieceCanMove(from, to))
                this.recalculateAttacks(from, to);
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
    console.log(board);
    console.log('attacks: ', board.attacks);
    console.log('blocks: ', board.blocks);

    // Add the onclick function that allows players to move pieces
    function onClick(event) {
        let box = boardDiv.getBoundingClientRect();
        let currentPosition = board.getCurrentPosition();
        let newPosition = new Position(1 + Math.floor((event.clientX - box.x) / 80), 8 - Math.floor((event.clientY - box.y) / 80));

        if (currentPosition != null && (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != board.getCurrentPlayerColor()))
        {
            console.log('MOVING PIECE');
            board.movePiece(currentPosition, newPosition);
            /*var gameState = board.calculateGameState();
            if (gameState != 'unresolved')
                window.alert(gameState);*/
            console.log('attacks: ', board.attacks);
            console.log('blocks: ', board.blocks);
        }
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
        {
            board.setCurrentPosition(newPosition);
            console.log('START');
            console.log('END:', board.getPieceMoves(newPosition));
        }
    }
    boardDiv.addEventListener("click", onClick);
});