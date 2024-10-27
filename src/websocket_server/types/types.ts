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

export type Winner = {
  name: string;
  wins: number;
};

export type Game = {
  id: string;
  idPlayers: string[];
  idBot?: string;
  botStep?: boolean;
  currentPlayer: number;
  playerShips: Ships[];
  workArray: FullData[];
};

export type FullData = {
  ships: ShipFull[];
  field: boolean[][];
};

export type Ships = Ship[] | null;

export type ShipFull = {
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

export type Point = {
  x: number;
  y: number;
};

export type ResOfShot = {
  res: string;
  indexShip: number;
};

type CurrentState = 'state1' | 'state2' | 'finish' | 'random' | '';

export type Bot = {
  id: string;
  dir: number;
  shift: number;
  dirGV: number;
  dirGor: number;
  dirVer: number;
  dirShift: number;
  currentState: CurrentState;
  oldState: CurrentState;
  oldI: number;
  oldJ: number;
  finI0: number;
  finJ0: number;
  finDI: number;
  finDJ: number;
  finI: number;
  finJ: number;
  varDir: Point[];
};
