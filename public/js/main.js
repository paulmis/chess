// @ts-check

// Returns the color and piece type of the initial piece at a given position
function InitialPiece(col, row) {
    // Get color
    this.color = row > 4 ? 'black' : 'white';

    // Get piece type
    if (row > 4) row = 9 - row;
    if (row == 2)
        this.type = 'pawn';
    else if (row == 1) {
        const figures = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        this.type = figures[col - 1];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.board')
    const tiles = document.querySelector('.tiles')
    const pieces = document.querySelector('.pieces')

    // Initialize tiles with appropriate color
    for (var row = 1; row <= 8; row++) {
        for (var col = 1; col <= 8; col++) {
            var tile = document.createElement('div');
            tile.setAttribute('class', 'tile ' + ((row * 9 + col) & 1 ? 'tile-black' : 'tile-white'));
            tile.setAttribute('id', 'tile' + (9 - row) + col);
            tiles.appendChild(tile);
        }
    }

    // Initialize pieces at appropriate positions
    for (var row = 1; row <= 8; row++)
        for (var col = 1; col <= 8; col++){
            var tile = document.getElementById('tile' + row + col);
            var piece = new InitialPiece(col, row);

            // Check if there should be a piece at all
            if (piece.type != null) {
                var pieceInstance = document.createElement('div');
                pieceInstance.style.backgroundImage = 'url(\'img/pieces/' + piece.color + '/' + piece.type + '.svg\')';
                pieceInstance.setAttribute('class', 'piece');
                tile.appendChild(pieceInstance);
            }
        }

    function tileHasPiece(row, col) {
        let tile = document.getElementById('tile' + row + col);
        return tile.childNodes.length != 0;
    }

    function tileGetPiece(row, col) {
        if (!tileHasPiece(row, col))
            return null;
        let tile = document.getElementById('tile' + row + col);
        return tile.childNodes[0];
    }

    var currentPosition = null
    function onClick(event) {
        let box = board.getBoundingClientRect();
        let row = 8 - Math.floor((event.clientY-box.y) / 80);
        let col = 1 + Math.floor((event.clientX-box.x) / 80);
        
        if (currentPosition != null && tileHasPiece(currentPosition.row, currentPosition.col)) {
            var piece = tileGetPiece(currentPosition.row, currentPosition.col);
            if (tileHasPiece(row, col))
                document.getElementById('tile' + row + col).childNodes[0].remove();
            document.getElementById('tile' + row + col).appendChild(piece);
            currentPosition = null;
        }
        else {
            var from = document.getElementById('tile' + row + col);
            if (from.childNodes.length != 0)
                currentPosition = {
                    'row': row,
                    'col': col
                };
        }
    }

    board.addEventListener("click", onClick);
});