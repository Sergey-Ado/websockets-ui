export type Client = {
  idClient: string;
  ws: any;
  idPlayer: string | null;
};

export type Player = {
  name: string;
  password: string;
};
