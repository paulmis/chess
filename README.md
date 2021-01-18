# chess
A simple and straightfoward browser implementation of chess for two players.

# functions
- start a new game:
  - choose game time,
  - choose time increment,
  - choose the side,
- join a game:
  - randomly, if one exists,
  - by link invitation to an existing game,
- play the game:
  - draw the board (tiles, row and column numbers),
  - rules:
    - show possible moves / verify whether a move is possible,
    - check for checks and check mates,
    - allow short and long castles,
    - promote pawns that reach the opposite end of the board,
    - capture an passant
   - allow concedes, ties, takebacks,
   - show game state (time left, pieces taken),
- misc: 
  - show number of players in game,
  - show number of games played
