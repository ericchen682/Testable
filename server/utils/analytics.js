const crypto = require('crypto');
    const db = require('./db');

    const insertAnalyticsStmt = db.prepare(`
        INSERT INTO analytics (id, user_id, card_id, set_id, correct, time_spent, reviewed_at) 
        VALUES (@id, @userId, @cardId, @setId, @correct, @timeSpent,@reviewedAt)
    `);

    

    function insertAnalyticsRecord({ userId, cardId, setId, correct,
    timeSpent, reviewedAt }) {
        insertAnalyticsStmt.run({
            id: crypto.randomUUID(),
            userId,
            cardId,
            setId,
            correct: correct ? 1 : 0,
            timeSpent,
            reviewedAt,
        });
    }


    const getAnalyticsForSetStmt = db.prepare(`              
        SELECT card_id,
            COUNT(*) AS attempts,                           
            SUM(correct) AS correct_count
        FROM analytics
        WHERE set_id = ? AND user_id = ?
        GROUP BY card_id
    `);

    function getAnalyticsForSet(setId, userId) {
        return getAnalyticsForSetStmt.all(setId,userId).map((row) => ({
            cardId: row.card_id,
            attempts: row.attempts,
            correctCount: row.correct_count,
            accuracy: Math.round((row.correct_count /row.attempts) * 100),
        }));
    }

    module.exports = { insertAnalyticsRecord, getAnalyticsForSet};