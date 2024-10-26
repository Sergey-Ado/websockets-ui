import { clients, players } from './database.js';
import { sendMessage } from './utils.js';

export function regPlayer(idClient: string, data: string) {
  const userData = JSON.parse(data);
  let client = clients.find((s) => s.idPlayer == userData.name);
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
  client = clients.find((s) => s.idClient == idClient);
  if (!client) return;
  const user = players.find((s) => s.name == userData.name);
  if (user) {
    if (user.password == userData.password) {
      const obj = { ...user, error: false, errorText: '' };
      client.idPlayer = userData.name;
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: User ${user.name} is logged in`);
    } else {
      const obj = { ...userData, error: true, errorText: 'Invalid password' };
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: invalid password of ${user.name}`);
    }
  } else {
    players.push({ name: userData.name, password: userData.password });
    const obj = { ...userData, error: false, errorText: '' };
    client.idPlayer = userData.name;
    sendMessage(idClient, 'reg', obj);
    console.log(`reg: User ${userData.name} registered and logged in`);
  }
}
