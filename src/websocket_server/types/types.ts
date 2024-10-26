export type Client = {
  id: string;
  ws: any;
  idPlayer: string | null;
  playerName: string;
};

export type Player = {
  id: string;
  name: string;
  password: string;
};

export type Room = {
  id: string;
  idPlayer: string;
  playerName: string;
};

export type Game = {
  id: string;
  players: string[];
  currentPlayer: number;
  playerShips: Ships[];
  workArray: FullData[];
};

type FullData = {
  ships: ShipFull[];
  field: boolean[][];
};

type Ships = Ship[];

type ShipFull = {
  decks: Point[];
  length: number;
  roundPoints: Point[];
};

type Ship = {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
};

type Point = {
  x: number;
  y: number;
};
