const db = require('./db');

// find all sets given a specific user
const listSetsForUserStmt = db.prepare(`
  SELECT s.id, s.title, s.is_published, s.updated_at,
         COUNT(c.id) AS cardCount
    FROM flashcard_sets s
    LEFT JOIN flashcards c ON c.set_id = s.id
   WHERE s.user_id = ?
   GROUP BY s.id
   ORDER BY s.updated_at DESC
`);

// find specific set given set id
const findSetByIdStmt = db.prepare('SELECT * FROM flashcard_sets WHERE id = ?');

// find cards given set id
const listCardsBySetIdStmt = db.prepare('SELECT id, front, back FROM flashcards WHERE set_id = ? ORDER BY position ASC');

// create a set
const insertSetStmt = db.prepare(`
  INSERT INTO flashcard_sets (id, user_id, title, is_published, created_at, updated_at)
  VALUES (@id, @userId, @title, @isPublished, @createdAt, @updatedAt)
`);

// update metadata of a set
const updateSetMetaStmt = db.prepare('UPDATE flashcard_sets SET title = @title, updated_at = @updatedAt WHERE id = @id');

// delete a set and cascade its cards
const deleteSetStmt = db.prepare('DELETE FROM flashcard_sets WHERE id = ?');

// toggle published status of a set
const updatePublishedStmt = db.prepare('UPDATE flashcard_sets SET is_published = @isPublished, updated_at = @updatedAt WHERE id = @id');

// get all public sets
const listPublicSetsStmt = db.prepare(`
  SELECT s.id, s.title, s.updated_at,
         COUNT(c.id) AS cardCount
    FROM flashcard_sets s
    LEFT JOIN flashcards c ON c.set_id = s.id
   WHERE s.is_published = 1
   GROUP BY s.id
   ORDER BY s.updated_at DESC
`);

// delete all flashcards in a set
const deleteCardsForSetStmt = db.prepare('DELETE FROM flashcards WHERE set_id = ?');

// insert a card into a set
const insertCardStmt = db.prepare(`
  INSERT INTO flashcards (id, set_id, position, front, back)
  VALUES (@id, @setId, @position, @front, @back)
`);

// copy a set and its cards in a transaction
const copySetTx = db.transaction((newId, userId, originalSet, now) => {
  insertSetStmt.run({
    id: newId,
    userId,
    title: `${originalSet.title} (copy)`,
    isPublished: 0,
    createdAt: now,
    updatedAt: now,
  });
  originalSet.cards.forEach((card, index) => {
    insertCardStmt.run({
      id: require('crypto').randomUUID(),
      setId: newId,
      position: index,
      front: card.front,
      back: card.back,
    });
  });
});

// convert snake to camelcase
function mapSetRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        isPublished: !!row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function getFlashcardSetsForUser(userId) {
  return listSetsForUserStmt.all(userId).map((row) => ({
    id: row.id,
    title: row.title,
    isPublished: !!row.is_published,
    cardCount: row.cardCount,
    updatedAt: row.updated_at,
  }));
}

function findFlashcardSetById(id) {
  const setRow = findSetByIdStmt.get(id);
  if (!setRow) return null;
  const set = mapSetRow(setRow);
  set.cards = listCardsBySetIdStmt.all(id);
  return set;
}

function createFlashcardSet({ id, userId, createdAt }) {
  insertSetStmt.run({
    id,
    userId,
    title: 'Untitled',
    isPublished: 0,
    createdAt,
    updatedAt: createdAt,
  });
  return findFlashcardSetById(id);
}

const replaceCardsTx = db.transaction((id, title, cards, updatedAt) => {
  updateSetMetaStmt.run({ id, title, updatedAt });
  deleteCardsForSetStmt.run(id);
  cards.forEach((card, index) => {
    insertCardStmt.run({
      id: card.id,
      setId: id,
      position: index,
      front: card.front,
      back: card.back,
    });
  });
});

function updateFlashcardSet(id, {title, cards, updatedAt }) {
  replaceCardsTx(id, title, cards, updatedAt);
  return findFlashcardSetById(id);
}

function deleteFlashcardSet(id) {
  return deleteSetStmt.run(id).changes > 0;
}

function publishFlashcardSet(id, isPublished, updatedAt) {
  updatePublishedStmt.run({ id, isPublished: isPublished ? 1 : 0, updatedAt });
  return findFlashcardSetById(id);
}

function getPublicFlashcardSets() {
  return listPublicSetsStmt.all().map((row) => ({
    id: row.id,
    title: row.title,
    cardCount: row.cardCount,
    updatedAt: row.updated_at,
  }));
}

function copyFlashcardSet(originalId, newId, userId, now) {
  const original = findFlashcardSetById(originalId);
  if (!original) return null;
  copySetTx(newId, userId, original, now);
  return findFlashcardSetById(newId);
}

module.exports = {
    getFlashcardSetsForUser,
    findFlashcardSetById,
    createFlashcardSet,
    updateFlashcardSet,
    deleteFlashcardSet,
    publishFlashcardSet,  
    getPublicFlashcardSets,
    copyFlashcardSet,
};

