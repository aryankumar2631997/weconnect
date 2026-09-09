const db = require('../../server/src/config/database');

const seedData = async (exitWhenDone = true) => {
    try {
        console.log('🌱 Seeding database...');

        // Services, grouped by category. Covers the sixteen categories
        // WeConnect is meant to launch with in Lakhisarai.
        const services = [
            { category: 'इलेक्ट्रीशियन', name: 'Electrician', name_hi: 'इलेक्ट्रीशियन' },
            { category: 'इलेक्ट्रीशियन', name: 'Wireman', name_hi: 'वायरमैन' },
            { category: 'प्लंबर', name: 'Plumber', name_hi: 'प्लंबर' },
            { category: 'प्लंबर', name: 'Pipe Fitter', name_hi: 'पाइप फिटर' },
            { category: 'AC/फ्रिज रिपेयर', name: 'AC Repair', name_hi: 'एसी रिपेयर' },
            { category: 'AC/फ्रिज रिपेयर', name: 'Fridge Repair', name_hi: 'फ्रिज रिपेयर' },
            { category: 'RO रिपेयर', name: 'RO Repair', name_hi: 'आरओ रिपेयर' },
            { category: 'वॉशिंग मशीन', name: 'Washing Machine Repair', name_hi: 'वॉशिंग मशीन रिपेयर' },
            { category: 'कारपेंटर', name: 'Carpenter', name_hi: 'कारपेंटर' },
            { category: 'कारपेंटर', name: 'Furniture Maker', name_hi: 'फर्नीचर मेकर' },
            { category: 'पेंटर', name: 'Painter', name_hi: 'पेंटर' },
            { category: 'पेंटर', name: 'Wallpaper Installer', name_hi: 'वॉलपेपर इंस्टॉलर' },
            { category: 'क्लीनर', name: 'Home Cleaning', name_hi: 'घर की सफाई' },
            { category: 'क्लीनर', name: 'Deep Cleaning', name_hi: 'डीप क्लीनिंग' },
            { category: 'पेस्ट कंट्रोल', name: 'Pest Control', name_hi: 'पेस्ट कंट्रोल' },
            { category: 'अप्लायंस इंस्टॉलेशन', name: 'Appliance Installation', name_hi: 'अप्लायंस इंस्टॉलेशन' },
            { category: 'ब्यूटी सेवा', name: 'Beauty at Home', name_hi: 'ब्यूटी सेवा (घर पर)' },
            { category: 'कंप्यूटर/मोबाइल रिपेयर', name: 'Computer Repair', name_hi: 'कंप्यूटर रिपेयर' },
            { category: 'कंप्यूटर/मोबाइल रिपेयर', name: 'Mobile Repair', name_hi: 'मोबाइल रिपेयर' },
            { category: 'बाइक/कार मैकेनिक', name: 'Bike Mechanic', name_hi: 'बाइक मैकेनिक' },
            { category: 'बाइक/कार मैकेनिक', name: 'Car Mechanic', name_hi: 'कार मैकेनिक' },
            { category: 'ट्यूटर', name: 'Home Tutor', name_hi: 'ट्यूटर' },
            { category: 'फोटोग्राफर', name: 'Photographer', name_hi: 'फोटोग्राफर' },
            { category: 'इवेंट/शादी सेवा', name: 'Event & Wedding Services', name_hi: 'इवेंट/शादी सेवा' },
        ];

        for (const service of services) {
            await db.query(
                `INSERT INTO services (category, name, name_hi) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (category, name) DO NOTHING`,
                [service.category, service.name, service.name_hi]
            );
        }

        console.log(`✅ Seed completed successfully (${services.length} services across 16 categories)`);
        if (exitWhenDone) process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        if (exitWhenDone) process.exit(1);
        else throw error;
    }
};

// `npm run seed` runs this directly and exits. When required from server.js
// at boot, exitWhenDone=false so a seed issue doesn't kill the whole process.
if (require.main === module) {
    seedData(true);
}

module.exports = seedData;
