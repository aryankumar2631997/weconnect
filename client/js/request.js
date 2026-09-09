document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('service');
    
    let selectedArea = '';
    let selectedService = null;
    let whatsappPhone = '917000000000'; // fallback until config loads

    // Load service details
    loadServiceDetails(serviceId);
    loadConfig();

    async function loadConfig() {
        try {
            const cfg = await api.get('/config');
            whatsappPhone = cfg.whatsappPhone;
        } catch (error) {
            console.error('Failed to load config, using fallback WhatsApp number:', error);
        }
    }

    // Area selection
    document.querySelectorAll('.area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            if (this.dataset.area === 'Other') {
                document.getElementById('otherArea').style.display = 'block';
                selectedArea = '';
            } else {
                document.getElementById('otherArea').style.display = 'none';
                selectedArea = this.dataset.area;
            }
        });
    });

    document.getElementById('otherArea').addEventListener('input', function() {
        selectedArea = this.value;
    });

    // WhatsApp button
    document.getElementById('whatsappBtn').addEventListener('click', async () => {
        await handleRequest('whatsapp');
    });

    // Call button
    document.getElementById('callBtn').addEventListener('click', async () => {
        await handleRequest('call');
    });

    async function loadServiceDetails(serviceId) {
        if (!serviceId) {
            document.getElementById('serviceName').textContent = 'Service not found';
            return;
        }

        try {
            const services = await api.get('/services');
            selectedService = services.find(s => s.id == serviceId);
            
            if (selectedService) {
                document.getElementById('serviceName').textContent = selectedService.name_hi || selectedService.name;
                document.getElementById('serviceCategory').textContent = selectedService.category;
            }
        } catch (error) {
            console.error('Failed to load service:', error);
        }
    }

    async function handleRequest(type) {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const description = document.getElementById('description').value.trim();

        // Validation
        if (!selectedService) {
            alert('Please select a service');
            return;
        }

        if (!selectedArea) {
            alert('Please select your area');
            return;
        }

        if (!phone || phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }

        // Create lead in database
        try {
            const leadData = {
                customer_name: name || 'Customer',
                customer_phone: phone,
                service_id: selectedService.id,
                area: selectedArea,
                description: description || 'No additional details',
                source: type === 'whatsapp' ? 'whatsapp' : 'call'
            };

            const lead = await api.post('/leads', leadData);
            
            // Show confirmation
            document.getElementById('leadConfirmation').style.display = 'block';
            
            // Handle WhatsApp/Call
            if (type === 'whatsapp') {
                const message = `Namaste, mujhe ${selectedService.name_hi || selectedService.name} chahiye.\n\nArea: ${selectedArea}`;
                const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            } else {
                window.location.href = `tel:${whatsappPhone}`;
            }

            // Disable buttons after submission
            document.getElementById('whatsappBtn').disabled = true;
            document.getElementById('callBtn').disabled = true;
            
        } catch (error) {
            console.error('Failed to create lead:', error);
            alert('Failed to create lead. Please try again.');
        }
    }
});