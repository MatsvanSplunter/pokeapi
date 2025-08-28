const mysql = require('mysql2/promise');

async function testImport() {
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
        console.log("🧪 Running test import...");

        // Clear any existing test data
        await db.query("DELETE FROM pokemon WHERE id BETWEEN 1 AND 5");
        console.log("✅ Cleared test data");

        // Simple test insert with minimum required fields
        await db.query(`
      INSERT INTO pokemon (
        id, name, type1, 
        against_normal, against_fire, against_water, against_electric, against_grass, against_ice, 
        against_fighting, against_poison, against_ground, against_flying, against_psychic, against_bug, 
        against_rock, against_ghost, against_dragon, against_dark, against_steel, against_fairy,
        hp, attack, defense, sp_attack, sp_defense, speed, generation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            1, 'bulbasaur', 'grass',
            1, 0.5, 0.5, 1, 0.5, 2, 1, 2, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1,
            45, 49, 49, 65, 65, 45, 1
        ]);

        console.log("✅ Test insert successful!");

        // Test retrieval
        const [rows] = await db.query("SELECT id, name, type1, hp FROM pokemon WHERE id = 1");
        console.log("📋 Retrieved data:", rows[0]);

        console.log("🎉 Test completed successfully!");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    } finally {
        await db.end();
    }
}

testImport();
