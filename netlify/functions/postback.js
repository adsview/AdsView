const admin = require('firebase-admin');

if (!admin.apps.length) {
    let pk = process.env.FIREBASE_PRIVATE_KEY || "";
    // ভুলবশত কোটেশন কপি হয়ে থাকলে বা \n নষ্ট হলে তা ফিক্স করার কোড
    pk = pk.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: pk,
        })
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    const { userid, network, secret } = event.queryStringParameters || {};
    const MY_SECRET = process.env.POSTBACK_SECRET || "EarnHubSecure123"; 
    
    if (secret !== MY_SECRET) {
        return { statusCode: 403, body: "Forbidden: Invalid Secret" };
    }
    if (!userid) {
        return { statusCode: 400, body: "Error: Missing userid" };
    }

    try {
        const earnedCoins = 50; 
        const userRef = db.collection('users').doc(userid);

        await userRef.update({
            coins: admin.firestore.FieldValue.increment(earnedCoins),
            adsWatched: admin.firestore.FieldValue.increment(1),
            success: admin.firestore.FieldValue.increment(1),
            earned: admin.firestore.FieldValue.increment(earnedCoins)
        });

        await userRef.collection('history').add({
            titleBn: `${network} থেকে বিজ্ঞাপন দেখা`,
            titleEn: `Ad watched from ${network}`,
            coin: `+${earnedCoins}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { statusCode: 200, body: "Success: Reward Added" };
    } catch (error) {
        console.error("Postback Error:", error);
        // এই লাইনটি আসল সমস্যা স্ক্রিনে দেখাবে
        return { statusCode: 500, body: "Error Details: " + error.message };
    }
};
 
