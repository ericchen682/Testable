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

  module.exports = { insertAnalyticsRecord };