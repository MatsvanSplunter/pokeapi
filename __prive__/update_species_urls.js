const mysql = require('mysql2/promise');

async function updateSpeciesUrls() {
    const db = await mysql.createConnection({
        host: '5.253.247.243',
        port: 5643,
        user: 'mysql',
        password: '5b65qdYB8SfQLXRtpdB7d6nWdGmZcAD9VbLAdwVVbzfVisxbr0H68MuUsODAYzbT',
        database: 'default'
    });

    try {
        console.log("🔄 Updating species URLs...");

        // Update alle Pokemon met de juiste species URL
        const [result] = await db.query(`
      UPDATE pokemon 
      SET species_url = CONCAT('https://pokeapi.co/api/v2/pokemon-species/', id, '/')
      WHERE species_url IS NULL OR species_url = ''
    `);

        console.log(`✅ Updated ${result.affectedRows} Pokemon species URLs`);

        // Test of het gewerkt heeft
        const [testRows] = await db.query('SELECT id, name, species_url FROM pokemon LIMIT 5');
        console.log("\n📋 Sample updated records:");
        testRows.forEach(row => {
            console.log(`${row.id}: ${row.name} -> ${row.species_url}`);
        });

    } catch (error) {
        console.error("❌ Error updating species URLs:", error.message);
    } finally {
        await db.end();
    }
}

updateSpeciesUrls();
