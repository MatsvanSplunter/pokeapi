CREATE DATABASE IF NOT EXISTS pokedex;

USE pokedex;

-- Drop existing table if exists and recreate with updated structure
DROP TABLE IF EXISTS pokemon;

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
    abilities TEXT,
    -- JSON string with abilities
    experience_growth VARCHAR(50),
    -- Experience growth rate name
    base_happiness INT,
    -- Base happiness
    order_number INT,
    -- Order from PokeAPI for sorting
    -- Sprites/Images
    sprite_front_default VARCHAR(255),
    -- Front sprite URL
    sprite_back_default VARCHAR(255),
    -- Back sprite URL
    sprite_front_shiny VARCHAR(255),
    -- Front shiny sprite URL
    sprite_back_shiny VARCHAR(255),
    -- Back shiny sprite URL
    sprite_official_artwork VARCHAR(255),
    -- Official artwork URL
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
    -- Meta information
    generation INT NOT NULL,
    is_legendary BOOLEAN DEFAULT FALSE
);