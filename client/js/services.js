document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        document.getElementById('categoryTitle').textContent = `${category} Services`;
    }

    try {
        const services = await api.get('/services');
        const filteredServices = category 
            ? services.filter(s => s.category === category)
            : services;
        
        renderServices(filteredServices);
    } catch (error) {
        console.error('Failed to load services:', error);
        document.getElementById('servicesContainer').innerHTML = 
            '<p class="error">Failed to load services. Please try again.</p>';
    }
});

function renderServices(services) {
    const container = document.getElementById('servicesContainer');
    
    if (!services || services.length === 0) {
        container.innerHTML = '<p>No services available in this category.</p>';
        return;
    }

    container.innerHTML = services.map(service => `
        <a href="request.html?service=${encodeURIComponent(service.id)}" class="service-item">
            <div>
                <div class="service-name service-name-hi">${service.name_hi || service.name}</div>
                <div class="service-name" style="font-size:0.75rem;color:var(--dark-gray);">${service.name}</div>
            </div>
            <span style="font-size:1.5rem;">→</span>
        </a>
    `).join('');
}