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
