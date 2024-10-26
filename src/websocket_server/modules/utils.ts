import { clients } from './database.js';
import { FullData, ShipFull, Ships } from '../types/types.js';

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

export function createWorkArray(ships: Ships): FullData {
  const fullData: FullData = { ships: [], field: [] };
  if (!ships) return fullData;
  ships.forEach((ship) => {
    const newShip: ShipFull = {
      decks: [],
      roundPoints: [],
      length: ship.length,
    };

    const xMin = ship.position.x - 1;
    const xMax =
      ship.position.x + 1 + (ship.length - 1) * Number(!ship.direction);
    const yMin = ship.position.y - 1;
    const yMax =
      ship.position.y + 1 + (ship.length - 1) * Number(ship.direction);
    for (let y = yMin; y <= yMax; y++)
      for (let x = xMin; x <= xMax; x++)
        if (x == xMin || x == xMax || y == yMin || y == yMax) {
          if (x >= 0 && x < 10 && y >= 0 && y < 10)
            newShip.roundPoints.push({ x, y });
        } else {
          newShip.decks.push({ x, y });
        }
    fullData.ships.push(newShip);
  });

  fullData.field = new Array(10).fill(0);
  fullData.field = fullData.field.map((s) => new Array(10).fill(false));
  fullData.field[2][2] = true;
  return fullData;
}
