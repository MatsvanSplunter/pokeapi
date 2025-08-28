const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection configuratie
const dbConfig = {
    host: "5.253.247.243",
    port: 5643,
    user: "mysql",
    password: "5b65qdYB8SfQLXRtpdB7d6nWdGmZcAD9VbLAdwVVbzfVisxbr0H68MuUsODAYzbT",
    database: "default",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Routes

// GET /api/pokemon - Alle Pokémon ophalen met optionele filtering
app.get('/api/pokemon', async (req, res) => {
    try {
        const {
            type,
            generation,
            legendary,
            limit = 1500,
            offset = 0,
            search
        } = req.query;

        let query = 'SELECT * FROM pokemon WHERE 1=1';
        const params = [];

        // Filtering opties
        if (type) {
            query += ' AND (type1 = ? OR type2 = ?)';
            params.push(type, type);
        }

        if (generation) {
            query += ' AND generation = ?';
            params.push(parseInt(generation));
        }

        if (legendary !== undefined) {
            query += ' AND is_legendary = ?';
            params.push(legendary === 'true');
        }

        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        // Paginatie - gebruik string interpolation voor LIMIT/OFFSET
        const limitInt = Math.max(1, Math.min(2000, parseInt(limit) || 1500));
        const offsetInt = Math.max(0, parseInt(offset) || 0);

        query += ` ORDER BY id LIMIT ${limitInt} OFFSET ${offsetInt}`;

        let rows;
        if (params.length > 0) {
            [rows] = await pool.execute(query, params);
        } else {
            [rows] = await pool.query(query);
        }

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pokemon datas 234'
        });
    }
});// GET /api/pokemon/:id - Specifieke Pokémon ophalen (PokeAPI compatible)
app.get('/api/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            'SELECT * FROM pokemon WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon not found'
            });
        }

        const pokemon = rows[0];

        // Transform data to be more PokeAPI-like
        const result = {
            id: pokemon.id,
            name: pokemon.name,
            base_experience: pokemon.base_experience,
            height: pokemon.height,
            weight: pokemon.weight,
            order: pokemon.order_number,
            is_default: true,
            abilities: pokemon.abilities ? JSON.parse(pokemon.abilities) : [],
            types: [
                { slot: 1, type: { name: pokemon.type1 } },
                ...(pokemon.type2 ? [{ slot: 2, type: { name: pokemon.type2 } }] : [])
            ],
            stats: [
                { base_stat: pokemon.hp, stat: { name: "hp" } },
                { base_stat: pokemon.attack, stat: { name: "attack" } },
                { base_stat: pokemon.defense, stat: { name: "defense" } },
                { base_stat: pokemon.sp_attack, stat: { name: "special-attack" } },
                { base_stat: pokemon.sp_defense, stat: { name: "special-defense" } },
                { base_stat: pokemon.speed, stat: { name: "speed" } }
            ],
            sprites: {
                front_default: pokemon.sprite_front_default,
                back_default: pokemon.sprite_back_default,
                front_shiny: pokemon.sprite_front_shiny,
                back_shiny: pokemon.sprite_back_shiny,
                other: {
                    "official-artwork": {
                        front_default: pokemon.sprite_official_artwork
                    }
                }
            },
            species: {
                name: pokemon.name
            },
            // Additional custom fields
            japanese_name: pokemon.japanese_name,
            classification: pokemon.classification,
            percentage_male: pokemon.percentage_male,
            capture_rate: pokemon.capture_rate,
            base_happiness: pokemon.base_happiness,
            experience_growth: pokemon.experience_growth,
            generation: pokemon.generation,
            is_legendary: pokemon.is_legendary,
            type_effectiveness: {
                against_normal: pokemon.against_normal,
                against_fire: pokemon.against_fire,
                against_water: pokemon.against_water,
                against_electric: pokemon.against_electric,
                against_grass: pokemon.against_grass,
                against_ice: pokemon.against_ice,
                against_fighting: pokemon.against_fighting,
                against_poison: pokemon.against_poison,
                against_ground: pokemon.against_ground,
                against_flying: pokemon.against_flying,
                against_psychic: pokemon.against_psychic,
                against_bug: pokemon.against_bug,
                against_rock: pokemon.against_rock,
                against_ghost: pokemon.against_ghost,
                against_dragon: pokemon.against_dragon,
                against_dark: pokemon.against_dark,
                against_steel: pokemon.against_steel,
                against_fairy: pokemon.against_fairy
            }
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pokemon data'
        });
    }
});

// GET /api/pokemon/name/:name - Pokémon zoeken op naam
app.get('/api/pokemon/name/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const [rows] = await pool.execute(
            'SELECT * FROM pokemon WHERE name LIKE ?',
            [`%${name}%`]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon not found'
            });
        }

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pokemon data4'
        });
    }
});

// GET /api/types - Alle beschikbare types ophalen
app.get('/api/types', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT DISTINCT type1 as type FROM pokemon 
            UNION 
            SELECT DISTINCT type2 as type FROM pokemon 
            WHERE type2 IS NOT NULL 
            ORDER BY type
        `);

        res.json({
            success: true,
            data: rows.map(row => row.type)
        });
    } catch (error) {
        console.error('Error fetching types:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching types data'
        });
    }
});

// GET /api/stats - Statistieken over de Pokédex
app.get('/api/stats', async (req, res) => {
    try {
        const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM pokemon');
        const [legendaryRows] = await pool.execute('SELECT COUNT(*) as legendary FROM pokemon WHERE is_legendary = true');
        const [generationRows] = await pool.execute('SELECT generation, COUNT(*) as count FROM pokemon GROUP BY generation ORDER BY generation');

        res.json({
            success: true,
            data: {
                total: totalRows[0].total,
                legendary: legendaryRows[0].legendary,
                generations: generationRows
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// GET /api/pokemon/random - Willekeurige Pokémon
app.get('/api/pokemon/random', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM pokemon ORDER BY RAND() LIMIT 1');

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching random pokemon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching random pokemon'
        });
    }
});

// GET /api/pokemon/type/:type - Pokémon filteren op type
app.get('/api/pokemon/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 1500, offset = 0 } = req.query;

        // Zorg voor geldige integers
        const limitInt = Math.max(1, Math.min(2000, parseInt(limit) || 1500));
        const offsetInt = Math.max(0, parseInt(offset) || 0);

        const [rows] = await pool.execute(
            `SELECT * FROM pokemon WHERE type1 = ? OR type2 = ? ORDER BY id LIMIT ${limitInt} OFFSET ${offsetInt}`,
            [type, type]
        );

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching pokemon by type:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pokemon by type'
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Pokémon API is running!',
        endpoints: {
            'GET /api/pokemon': 'Get all pokemon with optional filters',
            'GET /api/pokemon/:id': 'Get pokemon by pokedex number',
            'GET /api/pokemon/name/:name': 'Search pokemon by name',
            'GET /api/pokemon/type/:type': 'Get pokemon by type',
            'GET /api/pokemon/random': 'Get random pokemon',
            'GET /api/types': 'Get all available types',
            'GET /api/stats': 'Get pokedex statistics'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Pokémon API server is running on http://localhost:${PORT}`);
    console.log(`📖 API documentation available at http://localhost:${PORT}`);
});

module.exports = app;