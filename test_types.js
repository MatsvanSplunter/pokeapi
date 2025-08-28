const http = require('http');

function testAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/pokemon?limit=2',
        method: 'GET',
        timeout: 10000
    };

    console.log('🔍 Testing /api/pokemon endpoint for types structure...\n');

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);

                if (response.success && response.results && response.results.length > 0) {
                    const pokemon = response.results[0];

                    console.log('✅ API Response Status: SUCCESS');
                    console.log('✅ Pokemon Count:', response.count);
                    console.log('\n📦 First Pokemon Structure:');
                    console.log('- ID:', pokemon.id);
                    console.log('- Name:', pokemon.name);
                    console.log('- URL:', pokemon.url);

                    console.log('\n🎯 TYPES STRUCTURE CHECK:');
                    if (pokemon.types && Array.isArray(pokemon.types)) {
                        console.log('✅ Types is an array:', pokemon.types.length, 'types');

                        pokemon.types.forEach((typeEntry, index) => {
                            console.log(`\n  Type ${index + 1}:`);
                            console.log('    - Slot:', typeEntry.slot);
                            if (typeEntry.type) {
                                console.log('    - Type Name:', typeEntry.type.name);
                                console.log('    - Type URL:', typeEntry.type.url);
                            }
                        });

                        console.log('\n🎉 TYPES STRUCTURE IS CORRECT! Matches PokeAPI format.');
                    } else {
                        console.log('❌ Types is not an array or missing');
                        console.log('Current types value:', pokemon.types);
                    }

                    console.log('\n📋 Full Pokemon Object:');
                    console.log(JSON.stringify(pokemon, null, 2));

                } else {
                    console.log('❌ Invalid response structure');
                    console.log(data);
                }
            } catch (error) {
                console.error('❌ JSON Parse Error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request Error:', error.message);
    });

    req.on('timeout', () => {
        console.error('❌ Request Timeout');
        req.destroy();
    });

    req.end();
}

testAPI();
