const mysql = require('mysql2/promise');

async function updateDatabase() {
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
        console.log("🔄 Updating database structure...");

        // Check if table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'pokemon'");
        if (tables.length > 0) {
            console.log("📋 Backing up existing data...");

            // Create backup table
            await db.query("DROP TABLE IF EXISTS pokemon_backup");
            await db.query("CREATE TABLE pokemon_backup AS SELECT * FROM pokemon");
            console.log("✅ Backup created: pokemon_backup");
        }

        // Drop and recreate table with new structure
        await db.query("DROP TABLE IF EXISTS pokemon");

        await db.query(`
            CREATE TABLE pokemon (
                id INT NOT NULL PRIMARY KEY,
                -- National Dex number (id from PokeAPI)
                name VARCHAR(100) NOT NULL,
                -- English name
                japanese_name VARCHAR(100),
                -- Japanese name
                percentage_male DECIMAL(5, 2),
                -- e.g. 50.00 (NULL if genderless)
                type1 VARCHAR(50) NOT NULL,
                -- Primary type
                type2 VARCHAR(50),
                -- Secondary type
                classification VARCHAR(100),
                -- Pokedex classification (e.g. Seed Pokémon)
                height INT,
                -- Height in decimeters (PokeAPI format)
                weight INT,
                -- Weight in hectograms (PokeAPI format)
                base_experience INT,
                -- Base experience from PokeAPI
                capture_rate INT,
                -- Capture rate
                base_egg_steps INT,
                -- Egg hatching steps
                base_happiness INT,
                -- Base happiness
                experience_growth VARCHAR(50),
                -- Experience growth rate name
                order_number INT,
                -- Order from PokeAPI for sorting
                is_default BOOLEAN DEFAULT TRUE,
                -- Is default form
                -- JSON data fields for complex structures
                abilities TEXT,
                -- JSON: abilities with is_hidden, slot, etc.
                cries TEXT,
                -- JSON: latest and legacy cries URLs
                forms TEXT,
                -- JSON: forms array
                game_indices TEXT,
                -- JSON: game indices array
                held_items TEXT,
                -- JSON: held items with version details
                moves TEXT,
                -- JSON: moves with learn methods and levels
                past_abilities TEXT,
                -- JSON: past abilities from previous generations
                past_types TEXT,
                -- JSON: past types from previous generations
                location_area_encounters VARCHAR(255),
                -- URL to location encounters
                -- Sprites/Images - main sprites
                sprite_front_default VARCHAR(255),
                -- Front sprite URL
                sprite_back_default VARCHAR(255),
                -- Back sprite URL
                sprite_front_female VARCHAR(255),
                -- Front female sprite URL
                sprite_back_female VARCHAR(255),
                -- Back female sprite URL
                sprite_front_shiny VARCHAR(255),
                -- Front shiny sprite URL
                sprite_back_shiny VARCHAR(255),
                -- Back shiny sprite URL
                sprite_front_shiny_female VARCHAR(255),
                -- Front shiny female sprite URL
                sprite_back_shiny_female VARCHAR(255),
                -- Back shiny female sprite URL
                -- Other sprites
                sprite_official_artwork VARCHAR(255),
                -- Official artwork URL
                sprite_official_artwork_shiny VARCHAR(255),
                -- Official artwork shiny URL
                sprite_dream_world VARCHAR(255),
                -- Dream world sprite URL
                sprite_home VARCHAR(255),
                -- Home sprite URL
                sprite_home_shiny VARCHAR(255),
                -- Home shiny sprite URL
                sprite_showdown VARCHAR(255),
                -- Showdown sprite URL
                sprite_showdown_back VARCHAR(255),
                -- Showdown back sprite URL
                sprite_showdown_shiny VARCHAR(255),
                -- Showdown shiny sprite URL
                sprite_showdown_back_shiny VARCHAR(255),
                -- Showdown back shiny sprite URL
                -- Versions sprites (JSON for all generation versions)
                sprite_versions TEXT,
                -- JSON: all version sprites
                -- Type effectiveness multipliers
                against_normal DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Normal
                against_fire DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Fire
                against_water DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Water
                against_electric DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Electric
                against_grass DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Grass
                against_ice DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Ice
                against_fighting DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Fighting
                against_poison DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Poison
                against_ground DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Ground
                against_flying DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Flying
                against_psychic DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Psychic
                against_bug DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Bug
                against_rock DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Rock
                against_ghost DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Ghost
                against_dragon DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Dragon
                against_dark DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Dark
                against_steel DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Steel
                against_fairy DECIMAL(3, 1) NOT NULL,
                -- Effectiveness against Fairy
                -- Base stats
                hp INT NOT NULL,
                attack INT NOT NULL,
                defense INT NOT NULL,
                sp_attack INT NOT NULL,
                sp_defense INT NOT NULL,
                speed INT NOT NULL,
                -- EVs (effort values)
                ev_hp INT DEFAULT 0,
                ev_attack INT DEFAULT 0,
                ev_defense INT DEFAULT 0,
                ev_sp_attack INT DEFAULT 0,
                ev_sp_defense INT DEFAULT 0,
                ev_speed INT DEFAULT 0,
                -- Meta information
                generation INT NOT NULL,
                is_legendary BOOLEAN DEFAULT FALSE,
                -- Species data
                species_name VARCHAR(100),
                -- Species name
                species_url VARCHAR(255),
                -- Species URL
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ New pokemon table created with complete PokeAPI-compatible structure!");
        console.log("📊 Database now has 79 fields matching the full PokeAPI schema");
        console.log("🔄 You can now run the import script to populate with all PokeAPI data");
        console.log("🎯 Includes: sprites, type effectiveness, EVs, species URLs, and more!");

        await db.end();
    } catch (error) {
        console.error("❌ Error updating database:", error.message);
    }
}

updateDatabase();
