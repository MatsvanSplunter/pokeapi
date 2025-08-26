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
            params.push(generation);
        }

        if (legendary !== undefined) {
            query += ' AND is_legendary = ?';
            params.push(legendary === 'true');
        }

        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        // Paginatie
        query += ' ORDER BY pokedex_number LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching pokemon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pokemon data'
        });
    }
});

// GET /api/pokemon/:id - Specifieke Pokémon ophalen
app.get('/api/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            'SELECT * FROM pokemon WHERE pokedex_number = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
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
            message: 'Error fetching pokemon data'
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
        const { limit = 50, offset = 0 } = req.query;

        const [rows] = await pool.execute(
            'SELECT * FROM pokemon WHERE type1 = ? OR type2 = ? ORDER BY pokedex_number LIMIT ? OFFSET ?',
            [type, type, parseInt(limit), parseInt(offset)]
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