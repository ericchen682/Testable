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

    // Code to See Streak
    const getStreakForUserStmt = db.prepare(`                                                                            
        SELECT DISTINCT date(reviewed_at) AS review_date                                                                   
        FROM analytics                                                                                                     
        WHERE user_id = ?                     
        ORDER BY review_date DESC                                                                                          
    `);      
    // ALERT: WE ONLY NEED 1 COPY OF A DAY REVIEWED ENTRY ^ DO NOT USE THIS ONE FOR ANY OTHER DATA FETCHING

    function getStreakForUser(userId) {                                                                                  
        const dates = getStreakForUserStmt.all(userId).map(r => r.review_date);
        if (!dates.length) return 0;

        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        if (dates[0] !== today && dates[0] !== yesterday) return 0;

        let streak = 1;
        for (let i = 1; i < dates.length; i++) { // Cycle through to see number of consecutive days
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diff = (prev - curr) / 86400000;
            if (diff === 1) streak++;
            else break;
        }
        return streak;
    } 
    module.exports = { insertAnalyticsRecord, getAnalyticsForSet, getStreakForUser};