import { z } from 'zod'

// TODO set these up to play each other to conclusion
// simulate users of different skill levels
// have a leader board
// allow gambling on outcomes
// allow bounty for making better bots

// experiment with prompting the bots to do lookahead in reasoning

// pull in a chess rules engine to control that allowed moves in the game,
// preferrably with helpful descriptions.
// stockfish is the best game engine

// game is how to prompt an ai bot to play chess the best
// The leaderboard shows the winning bots and has prizes
// shows how stucks work and how royalties work.
// run them under many different scenarios so they have large parallel games.

export const parameters = z.object({
    start: z.object({}),
})

// store the game in state

const example = {
    'board': [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, 'N', 'P', null, null],
        ['P', 'P', 'P', 'P', null, 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', null, 'R'],
    ],
    'turn': 'w',
    'castling': {
        'white': { 'kingside': true, 'queenside': true },
        'black': { 'kingside': true, 'queenside': true },
    },
    'enPassant': null,
    'halfmoveClock': 1,
    'fullmoveNumber': 3,
}
const pieceEnum = z.enum([
    'r',
    'n',
    'b',
    'q',
    'k',
    'p',
    'R',
    'N',
    'B',
    'Q',
    'K',
    'P',
])

const rowSchema = z.array(pieceEnum).length(8)

const boardSchema = z.array(rowSchema).length(8)

const castlingRightsSchema = z.object({
    kingside: z.boolean(),
    queenside: z.boolean(),
})

const castlingSchema = z.object({
    white: castlingRightsSchema,
    black: castlingRightsSchema,
})

const gameStateSchema = z.object({
    board: boardSchema,
    turn: z.enum(['w', 'b']),
    castling: castlingSchema,
    enPassant: z.string().nullable(),
    halfmoveClock: z.number().int().gte(0),
    fullmoveNumber: z.number().int().gte(1),
})

// control what moves are allowed by having a move assessment bot that runs and
// may reject a proposed move back.

export const stateSchema = z.object({
    turns: z.number().int().gte(0),
    whiteTime: z.number().int().gte(0),
    blackTime: z.number().int().gte(0),
    startTime: z.number().int().gte(0),
})
