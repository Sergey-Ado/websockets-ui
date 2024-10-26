import { WebSocketServer } from 'ws';
import { clients } from './modules/database.js';
import { v4 as uuid } from 'uuid';
import { parseInput } from './modules/utils.js';
import { regPlayer } from './modules/regPlayers.js';

export function createWebSocket() {
  const wss = new WebSocketServer({ port: 3000 });

  console.log('Start websocket on port 3000...');

  wss.on('connection', (ws) => {
    const idClient = uuid();
    clients.push({ idClient, ws, idPlayer: null });

    ws.on('message', (message) => {
      const idPlayer = clients.find((s) => s.idClient == idClient)?.idPlayer;
      const messageParse: { type: string; data: string } = JSON.parse(
        message.toString()
      );
      if (messageParse.type && !idPlayer) {
        regPlayer(idClient, messageParse.data);
      }
    });

    ws.on('close', () => {
      const clientIndex = clients.findIndex((s) => s.idClient == idClient);
      if (clientIndex == -1) return;
      const idPlayer = clients[clientIndex].idPlayer;
      if (idPlayer) {
        console.log(`User ${idPlayer} has logged out`);
      }
      clients.splice(clientIndex, 1);
    });
  });
}
