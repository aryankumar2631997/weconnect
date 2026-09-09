document.addEventListener('DOMContentLoaded', async () => {
    try {
        const categories = await api.get('/services');
        renderCategories(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
        document.getElementById('categoriesContainer').innerHTML = 
            '<p class="error">Failed to load services. Please try again.</p>';
    }
});

function renderCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p>No services available.</p>';
        return;
    }

    // Group by category
    const categoryMap = {};
    categories.forEach(service => {
        if (!categoryMap[service.category]) {
            categoryMap[service.category] = [];
        }
        categoryMap[service.category].push(service);
    });

    container.innerHTML = Object.entries(categoryMap).map(([category, services]) => `
        <a href="services.html?category=${encodeURIComponent(category)}" class="category-card">
            <span class="category-icon">${getCategoryIcon(category)}</span>
            <span class="category-name">${category}</span>
            <span class="category-name-en">${getCategoryEnglishName(category)}</span>
        </a>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        'इलेक्ट्रीशियन': '⚡',
        'प्लंबर': '🔧',
        'AC/फ्रिज रिपेयर': '❄️',
        'RO रिपेयर': '💧',
        'वॉशिंग मशीन': '🌀',
        'कारपेंटर': '🔨',
        'पेंटर': '🎨',
        'क्लीनर': '🧹',
        'पेस्ट कंट्रोल': '🐜',
        'अप्लायंस इंस्टॉलेशन': '🔌',
        'ब्यूटी सेवा': '💇',
        'कंप्यूटर/मोबाइल रिपेयर': '💻',
        'बाइक/कार मैकेनिक': '🏍️',
        'ट्यूटर': '📘',
        'फोटोग्राफर': '📷',
        'इवेंट/शादी सेवा': '🎉',
    };
    return icons[category] || '📋';
}

function getCategoryEnglishName(category) {
    const translations = {
        'इलेक्ट्रीशियन': 'Electrician',
        'प्लंबर': 'Plumber',
        'AC/फ्रिज रिपेयर': 'AC/Fridge Repair',
        'RO रिपेयर': 'RO Repair',
        'वॉशिंग मशीन': 'Washing Machine',
        'कारपेंटर': 'Carpenter',
        'पेंटर': 'Painter',
        'क्लीनर': 'Cleaning',
        'पेस्ट कंट्रोल': 'Pest Control',
        'अप्लायंस इंस्टॉलेशन': 'Appliance Install',
        'ब्यूटी सेवा': 'Beauty at Home',
        'कंप्यूटर/मोबाइल रिपेयर': 'Computer/Mobile Repair',
        'बाइक/कार मैकेनिक': 'Bike/Car Mechanic',
        'ट्यूटर': 'Tutor',
        'फोटोग्राफर': 'Photographer',
        'इवेंट/शादी सेवा': 'Events/Wedding',
    };
    return translations[category] || category;
}