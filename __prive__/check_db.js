const mysql = require('mysql2/promise');

async function checkDatabase() {
    const db = mysql.createPool({
        host: "5.253.247.243",
        port: 5643,
        user: "mysql",
        password: "5b65qdYB8SfQLXRtpdB7d6nWdGmZcAD9VbLAdwVVbzfVisxbr0H68MuUsODAYzbT",
        database: "default",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("🔍 Checking database structure...");

        // Check tables
        const [tables] = await db.query("SHOW TABLES");
        console.log("📋 Tables:", tables.map(t => Object.values(t)[0]));

        // Check pokemon table structure if exists
        try {
            const [columns] = await db.query("DESCRIBE pokemon");
            console.log("\n🏗️ Pokemon table structure:");
            columns.forEach(col => {
                console.log(`  ${col.Field} - ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        } catch (error) {
            console.log("❌ Pokemon table doesn't exist:", error.message);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.end();
    }
}

checkDatabase();
