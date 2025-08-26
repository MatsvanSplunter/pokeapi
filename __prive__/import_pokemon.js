const axios = require('axios');
const mysql = require('mysql2/promise');

// 🔹 Type chart (alle 18 types)
const typeChart = {
  normal:     { fighting: 2, ghost: 0 },
  fire:       { fire: 0.5, water: 2, grass: 0.5, ice: 0.5, bug: 0.5, rock: 2, dragon: 2, steel: 0.5, fairy: 0.5 },
  water:      { fire: 0.5, water: 0.5, grass: 2, electric: 2, ice: 0.5, steel: 0.5 },
  electric:   { electric: 0.5, ground: 2, flying: 0.5, steel: 0.5 },
  grass:      { fire: 2, water: 0.5, grass: 0.5, ice: 2, poison: 2, ground: 0.5, flying: 2, bug: 2 },
  ice:        { fire: 2, ice: 0.5, fighting: 2, rock: 2, steel: 2 },
  fighting:   { flying: 2, psychic: 2, bug: 0.5, rock: 0.5, dark: 0.5, fairy: 2 },
  poison:     { grass: 0.5, fighting: 0.5, poison: 0.5, ground: 2, psychic: 2, bug: 0.5, fairy: 0.5 },
  ground:     { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  flying:     { electric: 2, grass: 0.5, fighting: 0.5, bug: 0.5, rock: 2 },
  psychic:    { fighting: 0.5, psychic: 0.5, bug: 2, ghost: 2, dark: 2 },
  bug:        { fire: 2, grass: 0.5, fighting: 0.5, ground: 0.5, flying: 2, rock: 2 },
  rock:       { normal: 0.5, fire: 0.5, water: 2, grass: 2, fighting: 2, poison: 0.5, ground: 2, steel: 2 },
  ghost:      { normal: 0, fighting: 0, poison: 0.5, bug: 0.5, ghost: 2, dark: 2 },
  dragon:     { fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5, ice: 2, dragon: 2, fairy: 2 },
  dark:       { fighting: 2, psychic: 0, ghost: 0.5, dark: 0.5, bug: 2, fairy: 2 },
  steel:      { normal: 0.5, fire: 2, grass: 0.5, ice: 0.5, fighting: 2, poison: 0, ground: 2, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5 },
  fairy:      { fighting: 0.5, poison: 2, bug: 0.5, dragon: 0, dark: 0.5, steel: 2 }
};

// 🔹 Bereken against multipliers
function calculateTypeEffectiveness(types) {
  const allTypes = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
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
  const db = await mysql.createPool({
    host: "localhost",
    user: "bit_academy",
    password: "bit_academy",
    database: "pokedex"
  });

  // Vind het aantal Pokémon van PokeAPI (1010+ in de nieuwste versies)
  const totalPokemonRes = await axios.get('https://pokeapi.co/api/v2/pokemon-species/?limit=1');
  const totalCount = totalPokemonRes.data.count;

  console.log(`Found ${totalCount} Pokémon. Starting import...`);

  for (let id = 1; id <= totalCount; id++) {
    try {
      // Basis Pokémon data
      const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const p = pokeRes.data;

      // Species data
      const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      const s = speciesRes.data;

      const name = p.name;
      const japaneseName = s.names.find(n => n.language.name === "ja")?.name || null;

      // Abilities
      const abilities = JSON.stringify(p.abilities.map(a => a.ability.name));

      // Types
      const type1 = p.types[0]?.type.name || null;
      const type2 = p.types[1]?.type.name || null;

      // Stats
      const hp        = p.stats.find(st => st.stat.name === "hp").base_stat;
      const attack    = p.stats.find(st => st.stat.name === "attack").base_stat;
      const defense   = p.stats.find(st => st.stat.name === "defense").base_stat;
      const spAttack  = p.stats.find(st => st.stat.name === "special-attack").base_stat;
      const spDefense = p.stats.find(st => st.stat.name === "special-defense").base_stat;
      const speed     = p.stats.find(st => st.stat.name === "speed").base_stat;

      // Type effectiveness
      const multipliers = calculateTypeEffectiveness([type1, type2].filter(Boolean));

      // INSERT
      await db.query(`
        INSERT INTO pokemon (
          name, japanese_name, pokedex_number, percentage_male,
          type1, type2, classification, height_m, weight_kg,
          capture_rate, base_egg_steps, abilities, experience_growth, base_happiness,
          against_normal, against_fire, against_water, against_electric, against_grass, against_ice, against_fighting, against_poison, against_ground, against_flying, against_psychic, against_bug, against_rock, against_ghost, against_dragon, against_dark, against_steel, against_fairy,
          hp, attack, defense, sp_attack, sp_defense, speed,
          generation, is_legendary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        japaneseName,
        p.id,
        s.gender_rate === -1 ? null : (100 - (s.gender_rate * 12.5)),
        type1,
        type2,
        s.genera.find(g => g.language.name === "en")?.genus || null,
        p.height / 10,
        p.weight / 10,
        s.capture_rate,
        s.hatch_counter ? (s.hatch_counter * 255) : null,
        abilities,
        s.growth_rate?.name,
        s.base_happiness,
        multipliers.against_normal, multipliers.against_fire, multipliers.against_water, multipliers.against_electric, multipliers.against_grass, multipliers.against_ice, multipliers.against_fighting, multipliers.against_poison, multipliers.against_ground, multipliers.against_flying, multipliers.against_psychic, multipliers.against_bug, multipliers.against_rock, multipliers.against_ghost, multipliers.against_dragon, multipliers.against_dark, multipliers.against_steel, multipliers.against_fairy,
        hp, attack, defense, spAttack, spDefense, speed,
        parseInt(s.generation.url.split("/").slice(-2, -1)[0]),
        s.is_legendary
      ]);

      console.log(`✅ Inserted ${name}`);
    } catch (err) {
      console.error(`❌ Error with Pokémon ${id}:`, err.message);
    }
  }

  console.log("🎉 Import finished!");
}

main();