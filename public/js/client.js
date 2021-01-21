const socket = new WebSocket('ws://localhost:3000');

socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    switch (message.type) {
        case 'start':
            // gets game variables
            // initializes the board view
        case 'move':
            // await a move
        case 'finished':
            // display result
        case 'updateStats':
            // update stats
    }
}

const boardDiv = document.querySelector('.board')
const tiles = document.querySelector('.tiles')
const pieces = document.querySelector('.pieces')

document.addEventListener('DOMContentLoaded', () => {
    // Generate a new board and initiate it with default pieces
    var board = new Board();
    console.log(board);
    board.initializeDefault();
    board.generateView(tiles, 'white');

    // Add the onclick function that allows players to move pieces
    function onClick(event) {
        let box = boardDiv.getBoundingClientRect();
        let currentPosition = board.getCurrentPosition();
        let newPosition = new Position(1 + Math.floor((event.clientX - box.x) / 80), 8 - Math.floor((event.clientY - box.y) / 80));

        if (currentPosition != null)
        {
            if (!board.hasPiece(newPosition) || board.getPiece(newPosition).getColor() != board.getCurrentPlayerColor()) {
                board.movePiece(currentPosition, newPosition);
                var gameState = board.calculateGameState();
                if (gameState != 'unresolved')
                    window.alert(gameState);
            }

            else if (currentPosition.equals(newPosition))
                board.resetCurrentPosition();
        }
            
        else if (board.hasPiece(newPosition) && board.getPiece(newPosition).getColor() == board.getCurrentPlayerColor())
            board.setCurrentPosition(newPosition);
    }

    
    boardDiv.addEventListener("click", onClick);
});