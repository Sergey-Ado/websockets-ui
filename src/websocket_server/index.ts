import { WebSocketServer } from 'ws';
import { clients, rooms } from './modules/database.js';
import { regPlayer } from './modules/regPlayers.js';
import {
  addUserToRoom,
  createRoom,
  deleteRoom,
  updateRoom,
} from './modules/roomCommands.js';
import { randomUUID } from 'crypto';

export function createWebSocket() {
  const wss = new WebSocketServer({ port: 3000 });

  console.log('Start websocket on port 3000...');

  wss.on('connection', (ws) => {
    const idClient = randomUUID();
    clients.push({ id: idClient, ws, idPlayer: null, playerName: '' });
    console.log(`Client with id=${idClient} connected`);

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
        }
      }
    });

    ws.on('close', () => {
      const indexClient = clients.findIndex((client) => client.id == idClient);
      if (indexClient == -1) return;

      if (clients[indexClient].idPlayer)
        deleteRoom(clients[indexClient].idPlayer);

      const idPlayer = clients[indexClient].idPlayer;
      if (idPlayer) {
        console.log(`User with id=${idPlayer} has logged out`);
      }

      clients.splice(indexClient, 1);
      console.log(`Client with id=${idClient} disconnected`);
    });
  });
}
