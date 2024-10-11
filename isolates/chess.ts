import { z } from 'zod'

// TODO set these up to play each other to conclusion
// simulate users of different skill levels
// have a leader board
// allow gambling on outcomes
// allow bounty for making better bots

// experiment with prompting the bots to do lookahead in reasoning

// pull in a chess rules engine to control that allowed moves in the game,
// preferably with helpful descriptions.
// stockfish is the best game engine

// game is how to prompt an ai bot to play chess the best
// The leaderboard shows the winning bots and has prizes
// shows how stucks work and how royalties work.
// run them under many different scenarios so they have large parallel games.

export const parameters = z.object({
  start: z.object({}),
})

const pieceEnum = z
  .enum(['r', 'n', 'b', 'q', 'k', 'p', 'R', 'N', 'B', 'Q', 'K', 'P'])

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

export const stateSchema = z.object({
  board: boardSchema,
  turn: z.enum(['w', 'b']),
  castling: castlingSchema,
  enPassant: z.string().nullable(),
  halfmoveClock: z.number().int().gte(0),
  fullmoveNumber: z.number().int().gte(1),
})

// control what moves are allowed by having a move assessment bot that runs and
// may reject a proposed move back.
