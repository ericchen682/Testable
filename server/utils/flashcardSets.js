const db = require('./db');

const listSetsForUserStmt = db.prepare();
const findSetByIdStmt = db.prepare();
const listCardsBySetIdStmt = db.prepare();
const insertSetStmt = db.prepare();
const updateSetMetaStmt = db.prepare();
const deleteCardsForSetStmt = db.prepare();
const insertCardStmt = db.prepare();

function mapSetRow(row) {
    if (!row) return null;
    return {

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