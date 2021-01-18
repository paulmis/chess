document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.board')
    const pieces = document.querySelector('.pieces')

    for(x = 0; x < 8; x++) {
        var blackPawn = document.createElement('img');
        blackPawn.setAttribute('src', 'img/pieces/black/pawn.svg')
        blackPawn.setAttribute('class', 'piece');
        blackPawn.setAttribute('data-id', 'piece7' + x);
        blackPawn.setAttribute('style', 'transform: translate(' + 9 * x + 'vh, 9vh)');
        pieces.appendChild(blackPawn);
    }

    for(x = 0; x < 8; x++) {
        var whitePawn = document.createElement('img');
        whitePawn.setAttribute('src', 'img/pieces/white/pawn.svg')
        whitePawn.setAttribute('class', 'piece');
        whitePawn.setAttribute('data-id', 'piece2' + x);
        whitePawn.setAttribute('style', 'transform: translate(' + 9 * x + 'vh, 54vh)');
        pieces.appendChild(whitePawn);
    }
})

