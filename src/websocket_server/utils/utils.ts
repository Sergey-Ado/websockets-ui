import { clients } from '../modules/database.js';

export function parseInput(mes: string) {
  const message = JSON.parse(mes);
  return { type: message.type, data: message.data };
}

export function sendMessage(idClient: string, type: string, data: unknown) {
  const dataString = JSON.stringify(data);
  const obj = { type, data: dataString, id: 0 };
  const ws = clients.find((client) => client.id == idClient)?.ws;
  ws.send(JSON.stringify(obj));
}

export function testPoint(i: number, j: number): boolean {
  return i >= 0 && i < 10 && j >= 0 && j < 10;
}
