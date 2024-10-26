import { clients, players } from './database.js';
import { updateRoom } from './roomCommands.js';
import { sendMessage } from './utils.js';
import { randomUUID } from 'crypto';

export function regPlayer(idClient: string, data: string) {
  const userData = JSON.parse(data);
  let client = clients.find((s) => s.playerName == userData.name);
  if (client) {
    const obj = {
      ...userData,
      error: true,
      errorText: 'User is already logged in',
    };
    sendMessage(idClient, 'reg', obj);
    console.log(`reg: User ${userData.name} is already logged in`);
    return;
  }
  client = clients.find((s) => s.id == idClient);
  if (!client) return;
  const user = players.find((s) => s.name == userData.name);
  if (user) {
    if (user.password == userData.password) {
      const obj = {
        name: user.name,
        index: user.id,
        error: false,
        errorText: '',
      };
      client.idPlayer = user.id;
      client.playerName = user.name;
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: User ${user.name} is logged in`);
      updateRoom();
    } else {
      const obj = {
        name: user.name,
        index: user.id,
        error: true,
        errorText: 'Invalid password',
      };
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: invalid password of ${user.name}`);
    }
  } else {
    const newUser = {
      id: randomUUID(),
      name: userData.name,
      password: userData.password,
    };
    players.push(newUser);
    const obj = {
      name: newUser.name,
      index: newUser.id,
      error: false,
      errorText: '',
    };
    client.idPlayer = newUser.id;
    client.playerName = newUser.name;
    sendMessage(idClient, 'reg', obj);
    console.log(`reg: User ${userData.name} registered and logged in`);
    updateRoom();
  }
}
