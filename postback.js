const admin = require('firebase-admin');

// Firebase Admin ইনিশিয়ালাইজেশন
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        })
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // URL থেকে ডেটা রিসিভ করা
    const { userid, network, secret } = event.queryStringParameters || {};

    // সিকিউরিটি চেক
    const MY_SECRET = process.env.POSTBACK_SECRET || "EarnHubSecure123"; 
    
    if (secret !== MY_SECRET) {
        return { statusCode: 403, body: "Forbidden: Invalid Secret" };
    }
    if (!userid) {
        return { statusCode: 400, body: "Error: Missing userid" };
    }

    try {
        const earnedCoins = 50; // প্রতি অ্যাডে রিওয়ার্ড
        const userRef = db.collection('users').doc(userid);

        // ফায়ারবেজে পয়েন্ট আপডেট করা
        await userRef.update({
            coins: admin.firestore.FieldValue.increment(earnedCoins),
            adsWatched: admin.firestore.FieldValue.increment(1),
            success: admin.firestore.FieldValue.increment(1),
            earned: admin.firestore.FieldValue.increment(earnedCoins)
        });

        // হিস্ট্রি সেভ করা
        await userRef.collection('history').add({
            titleBn: `${network} থেকে বিজ্ঞাপন দেখা`,
            titleEn: `Ad watched from ${network}`,
            coin: `+${earnedCoins}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { statusCode: 200, body: "Success: Reward Added" };
    } catch (error) {
        console.error("Postback Error:", error);
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
