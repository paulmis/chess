const socket = new WebSocket('ws:://localhost:3000');

socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    switch (message.type) {
        case 'start':
            // gets game variables
            // initializes the board view
        case 'move':
            // await a move
        case 'over':
            // display result
        case 'updateStats':
            // update stats
    }
}