import { clients, rooms } from './database.js';
import { sendMessage } from './utils.js';
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
  console.log(`create_room: User ${client.playerName} created a room`);
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
  console.log('update_room: list of rooms has been sent to all clients');
}
