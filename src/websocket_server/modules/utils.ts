import { clients } from './database.js';

export function parseInput(mes: string) {
  const message = JSON.parse(mes);
  return { type: message.type, data: message.data };
}

export function sendMessage(idClient: string, type: string, data: unknown) {
  const dataString = data == '' ? '' : JSON.stringify(data);
  const obj = { type, data: dataString, id: 0 };
  const ws = clients.find((s) => s.id == idClient)?.ws;
  ws.send(JSON.stringify(obj));
}
