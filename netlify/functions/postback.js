const admin = require('firebase-admin');

exports.handler = async (event, context) => {
    const { userid, network, secret } = event.queryStringParameters || {};
    const MY_SECRET = process.env.POSTBACK_SECRET || "AdsViewSecure2077";

    if (secret !== MY_SECRET) {
        return { statusCode: 403, body: "Forbidden: Invalid Secret" };
    }
    if (!userid) {
        return { statusCode: 400, body: "Error: Missing userid" };
    }

    let debugEmail = process.env.FIREBASE_CLIENT_EMAIL || "Not Set";
    let debugProject = process.env.FIREBASE_PROJECT_ID || "Not Set";

    try {
        if (!admin.apps.length) {
            let pk = process.env.FIREBASE_PRIVATE_KEY || "";
            pk = pk.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: debugProject,
                    clientEmail: debugEmail,
                    privateKey: pk,
                })
            });
        }

        const db = admin.firestore();
        const earnedCoins = 50;
        const userRef = db.collection('users').doc(userid);

        // ডকুমেন্ট না থাকলেও যাতে এরর না দেয়, তাই set(merge:true) ব্যবহার করা হলো
        await userRef.set({
            coins: admin.firestore.FieldValue.increment(earnedCoins),
            adsWatched: admin.firestore.FieldValue.increment(1),
            success: admin.firestore.FieldValue.increment(1),
            earned: admin.firestore.FieldValue.increment(earnedCoins)
        }, { merge: true });

        await userRef.collection('history').add({
            titleBn: `${network} থেকে বিজ্ঞাপন দেখা`,
            titleEn: `Ad watched from ${network}`,
            coin: `+${earnedCoins}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { statusCode: 200, body: "Success: Reward Added" };
    } catch (error) {
        // এবার এররের সাথে প্রজেক্ট আইডি এবং ইমেইলও স্ক্রিনে দেখাবে
        return {
            statusCode: 500,
            body: `Error Details: ${error.message} | Project used: ${debugProject} | Email used: ${debugEmail}`
        };
    }
};
