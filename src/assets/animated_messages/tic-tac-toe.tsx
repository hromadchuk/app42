const defaultBoardEmoji = '◻️';
const XEmoji = '❌';
const OEmoji = '⭕';

type TBoard = [string, string, string, string, string, string, string, string, string];

const generateBoardString = (board: TBoard) => {
    let boardString = '';

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            boardString += board[i * 3 + j];
        }
        boardString += '\n';
    }

    return boardString;
};

const checkWinner = (board: TBoard) => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] !== defaultBoardEmoji && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
};

const playGame = (mt: (key: string) => string) => {
    const board = Array(9).fill(defaultBoardEmoji);
    let currentPlayer = XEmoji;

    let boardString = `${defaultBoardEmoji.repeat(3)}
${defaultBoardEmoji.repeat(3)}
${defaultBoardEmoji.repeat(3)}`;
    const boardResult = [];

    while (!checkWinner(board as TBoard)) {
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === defaultBoardEmoji) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (emptyCells.length === 0) {
            break;
        }

        boardResult.push(boardString);
        boardString = '';

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const move = emptyCells[randomIndex];

        board[move] = currentPlayer;
        currentPlayer = currentPlayer === XEmoji ? OEmoji : XEmoji;

        boardString += generateBoardString(board as TBoard);
    }

    const winner = checkWinner(board as TBoard);
    if (winner) {
        boardString += mt('animations.ticTacToe.win').replace('{winner}', winner);
    } else {
        boardString += mt('animations.ticTacToe.draw');
    }
    boardResult.push(boardString);

    return boardResult;
};

export default playGame;
