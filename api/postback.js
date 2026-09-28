const admin = require('firebase-admin');

export default async function handler(req, res) {
    // Vercel-এ event এর বদলে req (request) এবং res (response) ব্যবহার করা হয়
    const { userid, network, secret } = req.query || {};
    const MY_SECRET = process.env.POSTBACK_SECRET || "AdsViewSecure2077";

    if (secret !== MY_SECRET) {
        return res.status(403).send("Forbidden: Invalid Secret");
    }
    if (!userid) {
        return res.status(400).send("Error: Missing userid");
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

        return res.status(200).send("Success: Reward Added");
    } catch (error) {
        return res.status(500).send(`Error Details: ${error.message} | Project: ${debugProject} | Email: ${debugEmail}`);
    }
              }
