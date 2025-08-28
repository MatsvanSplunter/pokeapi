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

async function testFullImport() {
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
        console.log("🧪 Testing full import with real PokeAPI data...");

        // Clear test data
        await db.query("DELETE FROM pokemon WHERE id = 1");

        // Get Bulbasaur data
        const pokeRes = await axios.get('https://pokeapi.co/api/v2/pokemon/1');
        const p = pokeRes.data;

        const speciesRes = await axios.get('https://pokeapi.co/api/v2/pokemon-species/1');
        const s = speciesRes.data;

        console.log("📥 Retrieved PokeAPI data for", p.name);

        // Process data exactly like the main import
        const name = p.name;
        const japaneseName = s.names.find(n => n.language.name === "ja")?.name || null;

        const abilitiesArray = p.abilities.map(ability => ({
            ability: {
                name: ability.ability.name,
                url: ability.ability.url
            },
            is_hidden: ability.is_hidden,
            slot: ability.slot
        }));
        const abilities = JSON.stringify(abilitiesArray);

        const type1 = p.types[0]?.type.name || null;
        const type2 = p.types[1]?.type.name || null;

        const multipliers = calculateTypeEffectiveness([type1, type2].filter(Boolean));

        // Insert with all real data
        await db.query(`
      INSERT INTO pokemon (
        id, name, japanese_name, percentage_male,
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
            p.id, name, japaneseName,
            s.gender_rate === -1 ? null : (100 - (s.gender_rate * 12.5)),
            type1, type2,
            s.genera.find(g => g.language.name === "en")?.genus || null,
            p.height, p.weight, p.base_experience,
            s.capture_rate, s.hatch_counter ? (s.hatch_counter * 255) : null,
            s.base_happiness, s.growth_rate?.name || null, p.order, p.is_default,
            abilities,
            JSON.stringify(p.cries || {}),
            JSON.stringify(p.forms || []),
            JSON.stringify(p.game_indices || []),
            JSON.stringify(p.held_items || []),
            JSON.stringify(p.moves || []),
            JSON.stringify(p.past_abilities || []),
            JSON.stringify(p.past_types || []),
            p.location_area_encounters,
            p.sprites.front_default, p.sprites.back_default,
            p.sprites.front_female, p.sprites.back_female,
            p.sprites.front_shiny, p.sprites.back_shiny,
            p.sprites.front_shiny_female, p.sprites.back_shiny_female,
            p.sprites.other?.['official-artwork']?.front_default || null,
            p.sprites.other?.['official-artwork']?.front_shiny || null,
            p.sprites.other?.dream_world?.front_default || null,
            p.sprites.other?.home?.front_default || null,
            p.sprites.other?.home?.front_shiny || null,
            p.sprites.other?.showdown?.front_default || null,
            p.sprites.other?.showdown?.back_default || null,
            p.sprites.other?.showdown?.front_shiny || null,
            p.sprites.other?.showdown?.back_shiny || null,
            JSON.stringify(p.sprites.versions || {}),
            multipliers.against_normal, multipliers.against_fire, multipliers.against_water, multipliers.against_electric, multipliers.against_grass, multipliers.against_ice, multipliers.against_fighting, multipliers.against_poison, multipliers.against_ground, multipliers.against_flying, multipliers.against_psychic, multipliers.against_bug, multipliers.against_rock, multipliers.against_ghost, multipliers.against_dragon, multipliers.against_dark, multipliers.against_steel, multipliers.against_fairy,
            p.stats.find(st => st.stat.name === "hp").base_stat,
            p.stats.find(st => st.stat.name === "attack").base_stat,
            p.stats.find(st => st.stat.name === "defense").base_stat,
            p.stats.find(st => st.stat.name === "special-attack").base_stat,
            p.stats.find(st => st.stat.name === "special-defense").base_stat,
            p.stats.find(st => st.stat.name === "speed").base_stat,
            p.stats.find(st => st.stat.name === "hp").effort,
            p.stats.find(st => st.stat.name === "attack").effort,
            p.stats.find(st => st.stat.name === "defense").effort,
            p.stats.find(st => st.stat.name === "special-attack").effort,
            p.stats.find(st => st.stat.name === "special-defense").effort,
            p.stats.find(st => st.stat.name === "speed").effort,
            parseInt(s.generation.url.split("/").slice(-2, -1)[0]),
            s.is_legendary, s.name, s.url
        ]);

        console.log("✅ Full import successful!");

        // Test retrieval
        const [rows] = await db.query("SELECT id, name, japanese_name, abilities, sprite_official_artwork FROM pokemon WHERE id = 1");
        const pokemon = rows[0];

        console.log("📋 Retrieved complete data:");
        console.log("  Name:", pokemon.name);
        console.log("  Japanese:", pokemon.japanese_name);
        console.log("  Abilities:", JSON.parse(pokemon.abilities || '[]').length, "abilities found");
        console.log("  Official Artwork:", pokemon.sprite_official_artwork ? "✅" : "❌");

        console.log("🎉 Complete test successful!");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    } finally {
        await db.end();
    }
}

testFullImport();
