import { WebSocketServer } from 'ws';
import { clients, rooms } from './modules/database.js';
import { regPlayer } from './modules/regPlayers.js';
import { createRoom, updateRoom } from './modules/roomCommands.js';
import { randomUUID } from 'crypto';

export function createWebSocket() {
  const wss = new WebSocketServer({ port: 3000 });

  console.log('Start websocket on port 3000...');

  wss.on('connection', (ws) => {
    const idClient = randomUUID();
    clients.push({ id: idClient, ws, idPlayer: null, playerName: '' });

    ws.on('message', (message) => {
      const messageParse: { type: string; data: string } = JSON.parse(
        message.toString()
      );
      const idPlayer = clients.find((s) => s.id == idClient)?.idPlayer;
      if (messageParse.type == 'reg' || !idPlayer) {
        regPlayer(idClient, messageParse.data);
      } else {
        switch (messageParse.type) {
          case 'create_room':
            createRoom(idClient);
            break;
        }
      }
    });

    ws.on('close', () => {
      const clientIndex = clients.findIndex((s) => s.id == idClient);
      if (clientIndex == -1) return;

      const indexRoom = rooms.findIndex(
        (room) => room.idPlayer == clients[clientIndex].idPlayer
      );
      if (indexRoom != -1) {
        rooms.splice(indexRoom, 1);
        updateRoom();
      }

      const playerName = clients[clientIndex].playerName;
      if (playerName.length > 0) {
        console.log(`User ${playerName} has logged out`);
      }
      clients.splice(clientIndex, 1);
    });
  });
}
