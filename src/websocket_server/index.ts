import { WebSocketServer } from 'ws';
import { clients } from './modules/database.js';
import { regPlayer } from './modules/player.js';
import {
  addUserToRoom,
  createRoom,
  createSingleGame,
  deleteRoom,
} from './modules/rooms.js';
import { randomUUID } from 'crypto';
import { addShips } from './modules/ships.js';
import { attack, deleteGame } from './modules/game.js';

export function createWebSocket() {
  const wss = new WebSocketServer({ port: 3000 });

  console.log('Start WebSocketServer on port 3000...');

  wss.on('connection', (ws) => {
    const idClient = randomUUID();
    clients.push({ id: idClient, ws, idPlayer: null, playerName: '' });
    console.log(`Client id=${idClient} connected`);

    ws.on('message', (message) => {
      const messageParse: { type: string; data: string } = JSON.parse(
        message.toString()
      );
      const idPlayer = clients.find(
        (client) => client.id == idClient
      )?.idPlayer;
      if (messageParse.type == 'reg' || !idPlayer) {
        regPlayer(idClient, messageParse.data);
      } else {
        switch (messageParse.type) {
          case 'create_room':
            createRoom(idClient);
            break;
          case 'add_user_to_room':
            addUserToRoom(idClient, messageParse.data);
            break;
          case 'add_ships':
            addShips(messageParse.data);
            break;
          case 'attack':
          case 'randomAttack':
            attack(idClient, messageParse.data);
            break;
          case 'single_play':
            createSingleGame(idClient);
            break;
        }
      }
    });

    ws.on('close', () => {
      const indexClient = clients.findIndex((client) => client.id == idClient);
      if (indexClient == -1) return;

      const idPlayer = clients[indexClient].idPlayer;
      if (idPlayer) {
        console.log(`disconnect: Player id=${idPlayer} disconnected`);

        deleteRoom(idPlayer, 'disconnect');
        deleteGame(idPlayer);
      }

      console.log(`disconnect: Client id=${idClient} deleted`);
      clients.splice(indexClient, 1);
    });
  });
}
