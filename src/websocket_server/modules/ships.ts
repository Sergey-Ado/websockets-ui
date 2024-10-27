import { FullData, Point, ShipFull, Ships } from '../types/types.js';
import { games } from './database.js';
import { startGame } from './game.js';
import { testPoint } from './utils.js';

export function addShips(data: string) {
  const dataParse = JSON.parse(data);
  const game = games.find((game) => game.id == dataParse.gameId);
  if (!game) return;
  const indexPlayer = game.idPlayers.findIndex(
    (idPlayer) => idPlayer == dataParse.indexPlayer
  );
  game.playerShips[indexPlayer] = dataParse.ships;
  game.workArray[indexPlayer] = createWorkArray(game.playerShips[indexPlayer]);
  console.log(
    `add_ships: Received a list of ships from the player id=${game.idPlayers[indexPlayer]}`
  );

  if (game.idPlayers[1] == '') {
    game.workArray[1] = createAllRandomShips();
    game.playerShips[1] = [];
  }

  if (game.playerShips[0] && game.playerShips[1]) startGame(game.id);
}

function createWorkArray(ships: Ships): FullData {
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
  return fullData;
}

export function createAllRandomShips(): FullData {
  const obj = {} as FullData;
  obj.ships = [];
  obj.field = [];
  for (let i = 0; i < 10; i++) obj.field.push(Array(10).fill(false));
  for (let size = 4; size > 0; size--)
    for (let i = 1; i <= 5 - size; i++) createRandomShip(obj, size);
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++) obj.field[i][j] = false;
  return obj;
}

function createRandomShip(obj: FullData, size: number) {
  while (!tryCreateRandomShip(obj, size)) {}
}

function tryCreateRandomShip(obj: FullData, size: number): boolean {
  const freePoints: Point[] = genFreePoints(obj);
  const direction = Math.floor(2 * Math.random());
  const index = Math.floor(freePoints.length * Math.random());
  const i0 = freePoints[index].x;
  const j0 = freePoints[index].y;
  if (testCreateRandomShip(obj, i0, j0, size, direction)) {
    createShip(obj, i0, j0, size, direction);
    editField(obj, i0, j0, size, direction);
    return true;
  } else return false;
}

function createShip(
  obj: FullData,
  i0: number,
  j0: number,
  size: number,
  direction: number
): void {
  const ship: ShipFull = { decks: [], length: size, roundPoints: [] };
  ship.length = size;
  const iMin = i0 - 1;
  const jMin = j0 - 1;
  const iMax = i0 + (size - 1) * direction + 1;
  const jMax = j0 + (size - 1) * (1 - direction) + 1;

  for (let i = iMin; i <= iMax; i++)
    for (let j = jMin; j <= jMax; j++)
      if (i == iMin || i == iMax || j == jMin || j == jMax) {
        if (testPoint(i, j)) {
          ship.roundPoints.push({ x: i, y: j });
        }
      } else {
        ship.decks.push({ x: i, y: j });
      }
  obj.ships.push(ship);
}

function genFreePoints(obj: FullData): Point[] {
  const freePoints = [];
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++)
      if (!obj.field[i][j]) freePoints.push({ x: i, y: j });
  return freePoints;
}

function editField(
  obj: FullData,
  i0: number,
  j0: number,
  size: number,
  direction: number
): void {
  for (let i = i0 - 1; i <= i0 + (size - 1) * direction + 1; i++)
    for (let j = j0 - 1; j <= j0 + (size - 1) * (1 - direction) + 1; j++)
      if (testPoint(i, j)) obj.field[i][j] = true;
}

function testCreateRandomShip(
  obj: FullData,
  i0: number,
  j0: number,
  size: number,
  direction: number
): boolean {
  for (let k = 1; k < size; k++) {
    const i = i0 + k * direction;
    const j = j0 + k * (1 - direction);
    if (i > 9 || j > 9 || obj.field[i][j]) return false;
  }
  return true;
}
