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
            var pieceInstance = document.createElement('img');
            var piece = new InitialPiece(col, row);

            // Check if there should be a piece at all
            if (piece.type != null) {
                pieceInstance.src = 'img/pieces/' + piece.color + '/' + piece.type + '.svg';
                pieceInstance.setAttribute('class', 'piece');
                tile.appendChild(pieceInstance);
            }
        }
})

