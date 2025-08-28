const axios = require('axios');
const mysql = require('mysql2/promise');

// 🔹 Type chart (alle 18 types)
const typeChart = {
    normal: { fighting: 2, ghost: 0 },
    fire: { fire: 0.5, water: 2, grass: 0.5, ice: 0.5, bug: 0.5, rock: 2, dragon: 2, steel: 0.5, fairy: 0.5 },
    water: { fire: 0.5, water: 0.5, grass: 2, electric: 2, ice: 0.5, steel: 0.5 },
    electric: { electric: 0.5, ground: 2, flying: 0.5, steel: 0.5 },
    grass: { fire: 2, water: 0.5, grass: 0.5, ice: 2, poison: 2, ground: 0.5, flying: 2, bug: 2 },
    ice: { fire: 2, ice: 0.5, fighting: 2, rock: 2, steel: 2 },
    fighting: { flying: 2, psychic: 2, bug: 0.5, rock: 0.5, dark: 0.5, fairy: 2 },
    poison: { grass: 0.5, fighting: 0.5, poison: 0.5, ground: 2, psychic: 2, bug: 0.5, fairy: 0.5 },
    ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
    flying: { electric: 2, grass: 0.5, fighting: 0.5, bug: 0.5, rock: 2 },
    psychic: { fighting: 0.5, psychic: 0.5, bug: 2, ghost: 2, dark: 2 },
    bug: { fire: 2, grass: 0.5, fighting: 0.5, ground: 0.5, flying: 2, rock: 2 },
    rock: { normal: 0.5, fire: 0.5, water: 2, grass: 2, fighting: 2, poison: 0.5, ground: 2, steel: 2 },
    ghost: { normal: 0, fighting: 0, poison: 0.5, bug: 0.5, ghost: 2, dark: 2 },
    dragon: { fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5, ice: 2, dragon: 2, fairy: 2 },
    dark: { fighting: 2, psychic: 0, ghost: 0.5, dark: 0.5, bug: 2, fairy: 2 },
    steel: { normal: 0.5, fire: 2, grass: 0.5, ice: 0.5, fighting: 2, poison: 0, ground: 2, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5 },
    fairy: { fighting: 0.5, poison: 2, bug: 0.5, dragon: 0, dark: 0.5, steel: 2 }
};

// 🔹 Bereken against multipliers
function calculateTypeEffectiveness(types) {
    const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
    const multipliers = {};

    allTypes.forEach(atkType => {
        let mult = 1;
        types.forEach(defType => {
            if (typeChart[defType] && typeChart[defType][atkType]) {
                mult *= typeChart[defType][atkType];
            }
        });
        multipliers[`against_${atkType}`] = mult;
    });

    return multipliers;
}

// 🔹 Main
async function main() {
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

    // Test database connectie eerst
    try {
        console.log("🔗 Testing database connection...");
        const connection = await db.getConnection();
        console.log("✅ Database connection successful!");
        connection.release();
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        return;
    }

    // Vind het aantal Pokémon van PokeAPI (1010+ in de nieuwste versies)
    const totalPokemonRes = await axios.get('https://pokeapi.co/api/v2/pokemon-species/?limit=1');
    const totalCount = totalPokemonRes.data.count;

    console.log(`Found ${totalCount} Pokémon. Starting import of first 10 for testing...`);

    for (let id = 1; id <= 10; id++) {
        try {
            // Basis Pokémon data
            const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const p = pokeRes.data;

            // Species data
            const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const s = speciesRes.data;

            const name = p.name;
            const japaneseName = s.names.find(n => n.language.name === "ja")?.name || null;

            // Abilities - complete structure with URL
            const abilitiesArray = p.abilities.map(ability => ({
                ability: {
                    name: ability.ability.name,
                    url: ability.ability.url
                },
                is_hidden: ability.is_hidden,
                slot: ability.slot
            }));
            const abilities = JSON.stringify(abilitiesArray);

            // Types
            const type1 = p.types[0]?.type.name || null;
            const type2 = p.types[1]?.type.name || null;

            // Stats (base stats and EVs)
            const hp = p.stats.find(st => st.stat.name === "hp").base_stat;
            const attack = p.stats.find(st => st.stat.name === "attack").base_stat;
            const defense = p.stats.find(st => st.stat.name === "defense").base_stat;
            const spAttack = p.stats.find(st => st.stat.name === "special-attack").base_stat;
            const spDefense = p.stats.find(st => st.stat.name === "special-defense").base_stat;
            const speed = p.stats.find(st => st.stat.name === "speed").base_stat;

            // EVs (effort values)
            const evHp = p.stats.find(st => st.stat.name === "hp").effort;
            const evAttack = p.stats.find(st => st.stat.name === "attack").effort;
            const evDefense = p.stats.find(st => st.stat.name === "defense").effort;
            const evSpAttack = p.stats.find(st => st.stat.name === "special-attack").effort;
            const evSpDefense = p.stats.find(st => st.stat.name === "special-defense").effort;
            const evSpeed = p.stats.find(st => st.stat.name === "speed").effort;

            // Sprites - comprehensive
            const sprites = {
                front_default: p.sprites.front_default,
                back_default: p.sprites.back_default,
                front_female: p.sprites.front_female,
                back_female: p.sprites.back_female,
                front_shiny: p.sprites.front_shiny,
                back_shiny: p.sprites.back_shiny,
                front_shiny_female: p.sprites.front_shiny_female,
                back_shiny_female: p.sprites.back_shiny_female,
                official_artwork: p.sprites.other?.['official-artwork']?.front_default || null,
                official_artwork_shiny: p.sprites.other?.['official-artwork']?.front_shiny || null,
                dream_world: p.sprites.other?.dream_world?.front_default || null,
                home: p.sprites.other?.home?.front_default || null,
                home_shiny: p.sprites.other?.home?.front_shiny || null,
                showdown: p.sprites.other?.showdown?.front_default || null,
                showdown_back: p.sprites.other?.showdown?.back_default || null,
                showdown_shiny: p.sprites.other?.showdown?.front_shiny || null,
                showdown_back_shiny: p.sprites.other?.showdown?.back_shiny || null
            };

            // JSON data fields - exact PokeAPI structure
            const cries = JSON.stringify(p.cries || {});
            const forms = JSON.stringify(p.forms || []);
            const gameIndices = JSON.stringify(p.game_indices || []);
            const heldItems = JSON.stringify(p.held_items || []);
            const moves = JSON.stringify(p.moves || []);
            const pastAbilities = JSON.stringify(p.past_abilities || []);
            const pastTypes = JSON.stringify(p.past_types || []);
            const spriteVersions = JSON.stringify(p.sprites.versions || {});

            // Type effectiveness
            const multipliers = calculateTypeEffectiveness([type1, type2].filter(Boolean));

            // INSERT - Complete with all PokeAPI fields
            await db.query(`
        INSERT INTO pokemon (
          pokedex_number, name, japanese_name, percentage_male,
          type1, type2, classification, height, weight, base_experience,
          capture_rate, base_egg_steps, base_happiness, experience_growth, order_number, is_default,
          abilities, cries, forms, game_indices, held_items, moves, past_abilities, past_types, location_area_encounters,
          sprite_front_default, sprite_back_default, sprite_front_female, sprite_back_female,
          sprite_front_shiny, sprite_back_shiny, sprite_front_shiny_female, sprite_back_shiny_female,
          sprite_official_artwork, sprite_official_artwork_shiny, sprite_dream_world,
          sprite_home, sprite_home_shiny, sprite_showdown, sprite_showdown_back, sprite_showdown_shiny, sprite_showdown_back_shiny,
          sprite_versions,
          against_normal, against_fire, against_water, against_electric, against_grass, against_ice, against_fighting, against_poison, against_ground, against_flying, against_psychic, against_bug, against_rock, against_ghost, against_dragon, against_dark, against_steel, against_fairy,
          hp, attack, defense, sp_attack, sp_defense, speed,
          ev_hp, ev_attack, ev_defense, ev_sp_attack, ev_sp_defense, ev_speed,
          generation, is_legendary, species_name, species_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                p.id,                                    // id (exact PokeAPI ID)
                name,                                    // name
                japaneseName,                           // japanese_name
                s.gender_rate === -1 ? null : (100 - (s.gender_rate * 12.5)), // percentage_male
                type1,                                  // type1
                type2,                                  // type2
                s.genera.find(g => g.language.name === "en")?.genus || null, // classification
                p.height,                               // height (PokeAPI format: decimeters)
                p.weight,                               // weight (PokeAPI format: hectograms)
                p.base_experience,                      // base_experience
                s.capture_rate,                         // capture_rate
                s.hatch_counter ? (s.hatch_counter * 255) : null, // base_egg_steps
                s.base_happiness,                       // base_happiness
                s.growth_rate?.name || null,            // experience_growth
                p.order,                                // order_number
                p.is_default,                           // is_default
                abilities,                              // abilities (JSON with ability URLs, is_hidden, slot)
                cries,                                  // cries (JSON with latest/legacy URLs)
                forms,                                  // forms (JSON array)
                gameIndices,                            // game_indices (JSON array)
                heldItems,                              // held_items (JSON with version details)
                moves,                                  // moves (JSON with learn methods, levels, etc.)
                pastAbilities,                          // past_abilities (JSON)
                pastTypes,                              // past_types (JSON)
                p.location_area_encounters,             // location_area_encounters URL
                sprites.front_default,                  // sprite_front_default
                sprites.back_default,                   // sprite_back_default
                sprites.front_female,                   // sprite_front_female
                sprites.back_female,                    // sprite_back_female
                sprites.front_shiny,                    // sprite_front_shiny
                sprites.back_shiny,                     // sprite_back_shiny
                sprites.front_shiny_female,             // sprite_front_shiny_female
                sprites.back_shiny_female,              // sprite_back_shiny_female
                sprites.official_artwork,               // sprite_official_artwork
                sprites.official_artwork_shiny,         // sprite_official_artwork_shiny
                sprites.dream_world,                    // sprite_dream_world
                sprites.home,                           // sprite_home
                sprites.home_shiny,                     // sprite_home_shiny
                sprites.showdown,                       // sprite_showdown
                sprites.showdown_back,                  // sprite_showdown_back
                sprites.showdown_shiny,                 // sprite_showdown_shiny
                sprites.showdown_back_shiny,            // sprite_showdown_back_shiny
                spriteVersions,                         // sprite_versions (JSON)
                // Type effectiveness multipliers
                multipliers.against_normal, multipliers.against_fire, multipliers.against_water, multipliers.against_electric, multipliers.against_grass, multipliers.against_ice, multipliers.against_fighting, multipliers.against_poison, multipliers.against_ground, multipliers.against_flying, multipliers.against_psychic, multipliers.against_bug, multipliers.against_rock, multipliers.against_ghost, multipliers.against_dragon, multipliers.against_dark, multipliers.against_steel, multipliers.against_fairy,
                // Base stats
                hp, attack, defense, spAttack, spDefense, speed,
                // EVs (effort values from PokeAPI stats.effort)
                evHp, evAttack, evDefense, evSpAttack, evSpDefense, evSpeed,
                // Meta
                parseInt(s.generation.url.split("/").slice(-2, -1)[0]), // generation
                s.is_legendary,                         // is_legendary
                s.name,                                 // species_name
                s.url                                   // species_url
            ]);

            console.log(`✅ Inserted ${name} (ID: ${p.id})`);
        } catch (err) {
            console.error(`❌ Error with Pokémon ${id}:`, err.message);
        }
    }

    console.log("🎉 Import finished!");
    await db.end();
}

main();
