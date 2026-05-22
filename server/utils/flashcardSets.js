const db = require('./db');

// find all sets given a specific user
const listSetsForUserStmt = db.prepare();

// find specific set given set id
const findSetByIdStmt = db.prepare();

// find cards given set id
const listCardsBySetIdStmt = db.prepare();

// create a set
const insertSetStmt = db.prepare();

// update metadata of a set
const updateSetMetaStmt = db.prepare();

// delete all flashcards in a set
const deleteCardsForSetStmt = db.prepare();

// insert a card into a set
const insertCardStmt = db.prepare();

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

}

function findFlashcardSetById(id) {

}

function createFlashcardSet({ id, userId, createdAt }) {

}

const replaceCardsTx = db.transaction();

function updateFlashcardSet(id, {title, cards, updatedAt }) {

}

module.exports = {
    getFlashcardSetsForUser,
    findFlashcardSetById,
    createFlashcardSet,
    updateFlashcardSet,
};