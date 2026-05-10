// read and write users from data/users,json

const fs = require('fs/promises');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function getUsers() {
  const rawUsers = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(rawUsers);
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find((user) => user.email === email);
}

async function findUserById(id) {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

module.exports = {
  getUsers,
  saveUsers,
  findUserByEmail,
  findUserById,
};
