import { randomUUID } from 'crypto';
import { Bot, Game, Point, ShipFull } from '../types/types.js';
import { bots, clients, games } from './database.js';
import { sendMessage, testPoint } from '../utils/utils.js';
import { sendTurn } from './game.js';

const delay = 500;

export function initBot(): string {
  const bot = {
    id: randomUUID(),
    dir: 2 * Math.round(Math.random()) - 1,
    shift: Math.floor(4 * Math.random()),
    dirGV: Math.floor(2 * Math.random()),
    dirGor: 2 * Math.round(Math.random()) - 1,
    dirVer: 2 * Math.round(Math.random()) - 1,
    dirShift: 2 * Math.round(Math.random()) - 1,
    currentState: 'state1',
    oldState: '',
  } as Bot;
  bots.push(bot);
  initOld(bot);
  return bot.id;
}

function initOld(bot: Bot) {
  const i = Math.round(4.5 - 4.5 * bot.dirVer);
  const j = Math.round(4.5 - (8.5 - bot.shift) * bot.dirGor);
  bot.oldI = (1 - bot.dirGV) * i + bot.dirGV * j;
  bot.oldJ = bot.dirGV * i + (1 - bot.dirGV) * j;
}

export async function botAttack(game: Game): Promise<boolean> {
  console.log('turn: bot John Doe moves');
  const bot = bots.find((bot) => bot.id == game.idBot);
  const idClient = clients.find(
    (client) => client.idPlayer == game.idPlayers[0]
  )?.id;
  if (!idClient || !bot) return false;
  let miss = false;
  let s = { index: -1 };
  const ships = game.workArray[0].ships;

  updateState: while (!miss) {
    if (bot.currentState == 'state1' || bot.currentState == 'state2') {
      let argI: number;
      let argJ: number;
      let next = true;
      while (next) {
        argI = (1 - bot.dirGV) * bot.oldI + bot.dirGV * bot.oldJ;
        argJ = bot.dirGV * bot.oldI + (1 - bot.dirGV) * bot.oldJ;
        argJ = argJ + 4 * bot.dirGor;

        if (argJ < 0 || argJ > 9) {
          argI += bot.dirVer;
          if (bot.dirGor * bot.dirShift > 0)
            argJ =
              (Math.round(4.5 + bot.dirVer * (argI - 4.5)) + bot.shift) % 4;
          else
            argJ =
              (4 +
                bot.shift -
                (Math.round(4.5 + bot.dirVer * (argI - 4.5)) % 4)) %
              4;
          if (bot.dirGor < 0) argJ = 9 - argJ;
        }

        if (argI < 0 || argI > 9) {
          if (bot.currentState == 'state1') {
            bot.oldState = 'state1';
            bot.currentState = 'state2';
            bot.shift = (bot.shift + 2) % 4;
            initOld(bot);
          } else {
            bot.oldState = 'state2';
            bot.currentState = 'random';
          }
          continue updateState;
        } else {
          bot.oldI = Math.round(
            (argI * (1 - bot.dirGV) - argJ * bot.dirGV) / (1 - 2 * bot.dirGV)
          );
          bot.oldJ = Math.round(
            (argJ * (1 - bot.dirGV) - argI * bot.dirGV) / (1 - 2 * bot.dirGV)
          );
          if (!game.workArray[0].field[bot.oldI][bot.oldJ]) next = false;
        }
      }

      const resShot = botShot(bot.oldI, bot.oldJ, s, ships);
      game.workArray[0].field[bot.oldI][bot.oldJ] = true;
      switch (resShot) {
        case 'miss': {
          miss = await sendMiss(idClient, game, bot.oldJ, bot.oldI);
          break;
        }
        case 'shot': {
          miss = await sendShot(idClient, game, bot.oldJ, bot.oldI);
          bot.oldState = bot.currentState;
          bot.oldState = bot.currentState;
          bot.currentState = 'finish';
          bot.finI0 = bot.oldI;
          bot.finJ0 = bot.oldJ;
          bot.finDI = 0;
          bot.finDJ = 0;
          bot.varDir = [];
          continue updateState;
          break;
        }
        case 'killed': {
          miss = await sendKilled(idClient, game, s);
          break;
        }
      }
    }
    if (bot.currentState == 'random') {
      const freePoints = [];
      for (let i = 0; i < 10; i++)
        for (let j = 0; j < 10; j++)
          if (!game.workArray[0].field[i][j]) freePoints.push({ x: i, y: j });
      const index = Math.floor(Math.random() * freePoints.length);
      bot.oldI = freePoints[index].x;
      bot.oldJ = freePoints[index].y;
      game.workArray[0].field[bot.oldI][bot.oldJ] = true;
      const res = botShot(bot.oldI, bot.oldJ, s, ships);
      if (res == 'miss')
        miss = await sendMiss(idClient, game, bot.oldJ, bot.oldI);
      if (res == 'shot')
        miss = await sendShot(idClient, game, bot.oldJ, bot.oldI);
      if (res == 'killed') miss = await sendKilled(idClient, game, s);
    }
    if (bot.currentState == 'finish') {
      if (bot.finDI == 0 && bot.finDJ === 0) {
        bot.varDir = [];
        for (let i = -1; i <= 1; i++)
          for (let j = -1; j <= 1; j++)
            if (
              Math.abs(i) !== Math.abs(j) &&
              testPoint(bot.finI0 + i, bot.finJ0 + j) &&
              !game.workArray[0].field[bot.finI0 + i][bot.finJ0 + j]
            ) {
              bot.varDir.push({ x: i, y: j });
            }
        const index = Math.floor(Math.random() * bot.varDir.length);
        bot.finI = bot.finI0 + bot.varDir[index].x;
        bot.finJ = bot.finJ0 + bot.varDir[index].y;
        game.workArray[0].field[bot.finI][bot.finJ] = true;
        const res = botShot(bot.finI, bot.finJ, s, ships);
        if (res == 'miss')
          miss = await sendMiss(idClient, game, bot.finJ, bot.finI);
        if (res == 'shot') {
          miss = await sendShot(idClient, game, bot.finJ, bot.finI);
          bot.finDI = bot.varDir[index].x;
          bot.finDJ = bot.varDir[index].y;
        }
        if (res == 'killed') {
          miss = await sendKilled(idClient, game, s);
          bot.currentState = bot.oldState;
          continue updateState;
        }
      } else {
        bot.finI = bot.finI + bot.finDI;
        bot.finJ = bot.finJ + bot.finDJ;
        if (
          !testPoint(bot.finI, bot.finJ) ||
          game.workArray[0].field[bot.finI][bot.finJ]
        ) {
          bot.finDI = -bot.finDI;
          bot.finDJ = -bot.finDJ;
          bot.finI = bot.finI0 + bot.finDI;
          bot.finJ = bot.finJ0 + bot.finDJ;
        }
        const res = botShot(bot.finI, bot.finJ, s, ships);
        game.workArray[0].field[bot.finI][bot.finJ] = true;
        if (res == 'miss') {
          miss = await sendMiss(idClient, game, bot.finJ, bot.finI);
          bot.finI = bot.finI0;
          bot.finJ = bot.finJ0;
          bot.finDI = -bot.finDI;
          bot.finDJ = -bot.finDJ;
        }
        if (res == 'shot')
          miss = await sendShot(idClient, game, bot.finJ, bot.finI);
        if (res == 'killed') {
          miss = await sendKilled(idClient, game, s);
          bot.currentState = bot.oldState;
          continue updateState;
        }
      }
    }
  }
  return false;
}

function botShot(
  i0: number,
  j0: number,
  s: { index: number },
  ships: ShipFull[]
): string {
  s.index = -1;
  for (let i = 0; i < ships.length; i++)
    for (let j = 0; j < ships[i].decks.length; j++)
      if (ships[i].decks[j].y == i0 && ships[i].decks[j].x == j0) s.index = i;
  if (s.index == -1) return 'miss';
  else {
    ships[s.index].length--;
    if (ships[s.index].length) return 'shot';
    else return 'killed';
  }
}

async function sendMiss(
  idClient: string,
  game: Game,
  x: number,
  y: number
): Promise<boolean> {
  const obj = {
    position: { x, y },
    currentPlayer: '',
    status: 'miss',
  };

  await new Promise((res) => {
    setTimeout(() => res(''), delay);
  });

  sendMessage(idClient, 'attack', obj);
  console.log(`attack: bot id=${game.idBot} missed`);
  sendTurn(game);

  return true;
}

async function sendShot(
  idClient: string,
  game: Game,
  x: number,
  y: number
): Promise<boolean> {
  const obj = {
    position: { x, y },
    currentPlayer: '',
    status: 'shot',
  };

  await new Promise((res) => {
    setTimeout(() => res(''), delay);
  });

  sendMessage(idClient, 'attack', obj);
  console.log(`attack: bot id=${game.idBot} shot`);
  return false;
}

async function sendKilled(
  idClient: string,
  game: Game,
  s: { index: number }
): Promise<boolean> {
  const ships = game.workArray[0].ships;
  const ship = ships[s.index];

  await new Promise((res) => {
    setTimeout(() => res(''), delay);
  });

  ship.decks.forEach((deck) => {
    const obj = {
      position: deck,
      currentPlayer: '',
      status: 'killed',
    };

    sendMessage(idClient, 'attack', obj);
  });

  ship.roundPoints.forEach((roundPoint) => {
    const obj = {
      position: roundPoint,
      currentPlayer: '',
      status: '',
    };

    sendMessage(idClient, 'attack', obj);
    game.workArray[0].field[roundPoint.y][roundPoint.x] = true;
  });

  console.log(`attack: bot id=${game.idBot} killed`);

  ships.splice(s.index, 1);
  if (!ships.length) {
    const obj = { winPlayer: '' };
    sendMessage(idClient, 'finish', obj);
    console.log(`finish: bot id=${game.idBot} won`);
    const indexBot = bots.findIndex((bot) => bot.id == game.idBot);
    if (indexBot != -1) {
      bots.splice(indexBot, 1);
      console.log(`finish: bot id=${game.idBot} deleted`);
    }
    const indexGame = games.findIndex((g) => g.id == game.id);
    if (indexGame != -1) {
      games.splice(indexGame, 1);
      console.log(`finish: Game id=${game.id} deleted`);
    }
    return true;
  }
  return false;
}
