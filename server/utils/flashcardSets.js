// read and write flashcard sets from data/flashcardSets.json

const fs = require('fs/promises');
const path = require('path');

const FLASHCARD_SETS_FILE = path.join(__dirname, '..', 'data', 'flashcardSets.json');

async function getFlashcardSets() {
  const rawSets = await fs.readFile(FLASHCARD_SETS_FILE, 'utf8');
  return JSON.parse(rawSets);
}

async function saveFlashcardSets(sets) {
  await fs.writeFile(FLASHCARD_SETS_FILE, JSON.stringify(sets, null, 2));
}

async function findFlashcardSetById(id) {
  const sets = await getFlashcardSets();
  return sets.find((set) => set.id === id);
}

module.exports = {
  getFlashcardSets,
  saveFlashcardSets,
  findFlashcardSetById,
};
