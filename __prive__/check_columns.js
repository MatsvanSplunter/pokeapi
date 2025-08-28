const mysql = require('mysql2/promise');

async function checkColumns() {
    const db = await mysql.createConnection({
        host: '5.253.247.243',
        port: 5643,
        user: 'root',
        password: 'bitacademy',
        database: 'default'
    });

    try {
        console.log("Checking database structure...");

        // Get column info
        const [columns] = await db.query('DESCRIBE pokemon');

        console.log(`\n📊 Total columns in pokemon table: ${columns.length}`);
        console.log("\n📋 All columns:");
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type})`);
        });

        // Count auto-generated columns
        const autoColumns = columns.filter(col =>
            col.Field === 'created_at' || col.Field === 'updated_at'
        );

        console.log(`\n⚠️  Auto-generated columns: ${autoColumns.length}`);
        console.log(`✅ Insertable columns: ${columns.length - autoColumns.length}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await db.end();
    }
}

checkColumns();
