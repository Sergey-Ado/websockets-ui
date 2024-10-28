import { Game } from '../types/types.js';
import { initBot } from './bot.js';
import { clients, games, rooms } from './database.js';
import { createAllRandomShips } from './ships.js';
import { sendMessage } from '../utils/utils.js';
import { randomUUID } from 'crypto';

export function createRoom(idClient: string) {
  const client = clients.find((s) => s.id == idClient);
  if (!client || !client.idPlayer) return;
  if (rooms.find((s) => s.idPlayer == client.idPlayer)) return;
  const obj = {
    id: randomUUID(),
    idPlayer: client.idPlayer,
    playerName: client.playerName,
  };
  rooms.push(obj);
  sendMessage(idClient, 'create_room', '');
  console.log(
    `create_room: Player id=${client.idPlayer} created a room id=${obj.id}`
  );
  updateRoom();
}

export function updateRoom() {
  const arr: unknown[] = [];
  rooms.forEach((room) => {
    arr.push({
      roomId: room.id,
      roomUsers: [{ name: room.playerName, index: room.idPlayer }],
    });
  });
  clients.forEach((client) => sendMessage(client.id, 'update_room', arr));
  console.log('update_room: list of rooms has been sent to all players');
}

export function addUserToRoom(idClient: string, data: string) {
  const dataParse = JSON.parse(data);
  const idPlayer = clients.find((client) => client.id == idClient)?.idPlayer;
  const room = rooms.find((room) => room.id == dataParse.indexRoom);
  if (!room) return;
  if (!idPlayer || !room.idPlayer) return;
  if (idPlayer == room.idPlayer) return;
  console.log(
    `add_user_to_room: Player id=${idPlayer} added to room id=${room.id}`
  );
  createGame(room.idPlayer, idPlayer);
}

function createGame(idMaster: string, idGuest: string) {
  const idGame = randomUUID();
  const game: Game = {
    id: idGame,
    idPlayers: [idMaster, idGuest],
    currentPlayer: 0,
    playerShips: [null, null],
    workArray: [],
  };
  games.push(game);
  [idMaster, idGuest].forEach((idPlayer) => {
    const idClient = clients.find((client) => client.idPlayer == idPlayer)?.id;
    if (idClient) sendMessage(idClient, 'create_game', { idGame, idPlayer });
    console.log(
      `create_game: Game id=${idGame} created with player id=${idMaster} and player id=${idGuest}`
    );
    deleteRoom(idPlayer, 'create_game');
  });
}

export function deleteRoom(idPlayer: string, command: string) {
  const indexRoom = rooms.findIndex((room) => room.idPlayer == idPlayer);
  if (indexRoom != -1) {
    const idRoom = rooms[indexRoom].id;
    console.log(`${command}: Room id=${idRoom} removed`);
    rooms.splice(indexRoom, 1);
    updateRoom();
  }
}

export function createSingleGame(idClient: string) {
  const idPlayer = clients.find((client) => client.id == idClient)?.idPlayer;
  if (!idPlayer) return;

  const idGame = randomUUID();
  const game: Game = {
    id: idGame,
    idPlayers: [idPlayer, ''],
    currentPlayer: 0,
    playerShips: [null, null],
    workArray: [],
  };
  game.idBot = initBot();
  game.botStep = false;
  game.workArray[1] = createAllRandomShips();
  game.playerShips[1] = [];

  games.push(game);
  if (idClient) sendMessage(idClient, 'create_game', { idGame, idPlayer });
  console.log(
    `single_game: Game id=${idGame} created with player id=${idPlayer} and bot id=${game.idBot}`
  );
  deleteRoom(idPlayer, 'single_game');
}
