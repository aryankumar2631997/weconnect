const API_BASE = '/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentLeadId = null;

// Escapes text before it's placed inside innerHTML template strings.
// Leads are created by anonymous customers (name/phone/area are free text),
// so this is required to prevent stored XSS against the admin dashboard.
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const adminUser = document.getElementById('adminUser');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const views = {
    leads: document.getElementById('leadsView'),
    providers: document.getElementById('providersView'),
    stats: document.getElementById('statsView')
};

// Check if already logged in
if (authToken) {
    showDashboard();
    loadDashboardData();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    loginError.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            loginError.textContent = data.error.message;
            loginError.style.display = 'block';
            return;
        }
        
        authToken = data.data.token;
        localStorage.setItem('adminToken', authToken);
        adminUser.textContent = data.data.user.username;
        showDashboard();
        loadDashboardData();
    } catch (error) {
        loginError.textContent = 'Network error. Please try again.';
        loginError.style.display = 'block';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    authToken = null;
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
}

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        Object.keys(views).forEach(key => {
            views[key].style.display = key === view ? 'block' : 'none';
        });
        
        if (view === 'leads') loadLeads();
        if (view === 'providers') loadProviders();
        if (view === 'stats') loadStats();
    });
});

// Load Dashboard Data
async function loadDashboardData() {
    loadStats();
    loadLeads();
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalLeads').textContent = data.data.leads.total || 0;
            document.getElementById('newLeads').textContent = data.data.leads.new || 0;
            document.getElementById('assignedLeads').textContent = data.data.leads.assigned || 0;
            document.getElementById('completedLeads').textContent = data.data.leads.completed || 0;
            document.getElementById('totalProviders').textContent = data.data.providers.total || 0;
            document.getElementById('verifiedProviders').textContent = data.data.providers.verified || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load Leads
async function loadLeads() {
    const tbody = document.getElementById('leadsTableBody');
    const statusFilter = document.getElementById('leadStatusFilter').value;
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    try {
        let url = `${API_BASE}/leads`;
        if (statusFilter) url += `?status=${statusFilter}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(lead => `
                <tr>
                    <td data-label="ID">#${lead.id}</td>
                    <td data-label="Customer"><strong>${escapeHtml(lead.customer_name)}</strong><br><small>${escapeHtml(lead.customer_phone)}</small></td>
                    <td data-label="Service">${escapeHtml(lead.service_name) || 'N/A'}</td>
                    <td data-label="Area">${escapeHtml(lead.area)}</td>
                    <td data-label="Status"><span class="status-badge ${lead.status}">${lead.status}</span></td>
                    <td data-label="Assigned To">${escapeHtml(lead.provider_name) || 'Unassigned'}</td>
                    <td data-label="Actions" class="action-btns">
                        <button onclick="viewLead(${lead.id})">👁️ View</button>
                        ${lead.status === 'NEW' ? `<button onclick="assignLead(${lead.id})">📋 Assign</button>` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No leads found</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Failed to load leads</td></tr>';
        console.error('Failed to load leads:', error);
    }
}

// Refresh leads
document.getElementById('refreshLeadsBtn').addEventListener('click', loadLeads);
document.getElementById('leadStatusFilter').addEventListener('change', loadLeads);

// Load Providers
async function loadProviders() {
    const grid = document.getElementById('providersGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/providers`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            grid.innerHTML = data.data.map(provider => `
                <div class="provider-card">
                    <h3>${escapeHtml(provider.name)}</h3>
                    <p class="phone">📞 ${escapeHtml(provider.phone)}</p>
                    <div class="tags">
                        ${(provider.services || []).map(id => `<span class="tag">Service ${id}</span>`).join('')}
                        ${(provider.areas || []).map(area => `<span class="tag">📍 ${escapeHtml(area)}</span>`).join('')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--spacing-sm);">
                        <span class="status ${provider.verification_status}">${provider.verification_status}</span>
                        <span style="font-size:0.75rem;color:var(--dark-gray);">
                            Leads: ${provider.total_leads || 0}
                        </span>
                    </div>
                    <div style="margin-top:var(--spacing-sm);font-size:0.75rem;color:var(--dark-gray);">
                        Completed: ${provider.completed_jobs || 0} | Pending: ${provider.pending_jobs || 0}
                    </div>
                    <button onclick="editProvider(${provider.id})" style="margin-top:var(--spacing-sm);padding:var(--spacing-xs) var(--spacing-md);background:var(--light-gray);border-radius:4px;font-size:0.75rem;">
                        Edit
                    </button>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<div class="loading">No providers found</div>';
        }
    } catch (error) {
        grid.innerHTML = '<div class="loading">Failed to load providers</div>';
        console.error('Failed to load providers:', error);
    }
}

// View Lead Detail
async function viewLead(leadId) {
    currentLeadId = leadId;
    const modal = document.getElementById('leadModal');
    const content = document.getElementById('leadDetailContent');
    content.innerHTML = '<div class="loading">Loading...</div>';
    modal.style.display = 'flex';
    
    try {
        const response = await fetch(`${API_BASE}/leads/${leadId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const lead = data.data;
            document.getElementById('leadCustomer').textContent = lead.customer_name;
            document.getElementById('leadPhone').textContent = lead.customer_phone;
            document.getElementById('leadService').textContent = lead.service_name || 'N/A';
            document.getElementById('leadArea').textContent = lead.area;
            document.getElementById('leadDescription').textContent = lead.description || 'N/A';
            document.getElementById('leadStatus').textContent = lead.status;
            document.getElementById('leadCreated').textContent = new Date(lead.created_at).toLocaleString();
            
            // Load providers for assignment
            await loadAvailableProviders(lead.service_id, lead.area);
            
            // Set up actions
            document.getElementById('leadWhatsApp').onclick = () => {
                const msg = `Namaste, ${lead.customer_name} ne ${lead.service_name} ke liye request kiya hai. Area: ${lead.area}`;
                window.open(`https://wa.me/91${lead.customer_phone}?text=${encodeURIComponent(msg)}`, '_blank');
            };
            
            document.getElementById('leadCall').onclick = () => {
                window.location.href = `tel:+91${lead.customer_phone}`;
            };
            
            document.getElementById('leadAssignBtn').onclick = () => assignLeadProvider(leadId);
            
            // Status buttons
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.onclick = () => updateLeadStatus(leadId, btn.dataset.status);
            });
        }
    } catch (error) {
        content.innerHTML = '<div class="loading">Failed to load lead details</div>';
        console.error('Failed to load lead:', error);
    }
}

async function loadAvailableProviders(serviceId, area) {
    try {
        const response = await fetch(`${API_BASE}/providers/available?service_id=${serviceId}&area=${area}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        const select = document.getElementById('leadAssignProvider');
        
        select.innerHTML = '<option value="">Select Provider</option>';
        if (data.success) {
            data.data.forEach(provider => {
                select.innerHTML += `<option value="${provider.id}">${escapeHtml(provider.name)}</option>`;
            });
        }
    } catch (error) {
        console.error('Failed to load providers:', error);
    }
}

async function assignLeadProvider(leadId) {
    const providerId = document.getElementById('leadAssignProvider').value;
    if (!providerId) {
        alert('Please select a provider');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/leads/${leadId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ provider_id: parseInt(providerId) })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Provider assigned successfully!');
            closeModal('leadModal');
            loadLeads();
        } else {
            alert('Failed to assign provider: ' + data.error.message);
        }
    } catch (error) {
        alert('Failed to assign provider');
        console.error(error);
    }
}

async function updateLeadStatus(leadId, status) {
    if (!confirm(`Update lead status to ${status}?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/leads/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Status updated successfully!');
            closeModal('leadModal');
            loadLeads();
            loadStats();
        } else {
            alert('Failed to update status: ' + data.error.message);
        }
    } catch (error) {
        alert('Failed to update status');
        console.error(error);
    }
}

function assignLead(leadId) {
    viewLead(leadId);
}

// Provider Modal
document.getElementById('addProviderBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add Provider';
    document.getElementById('providerId').value = '';
    document.getElementById('providerForm').reset();
    document.getElementById('providerModal').style.display = 'flex';
    loadCategoriesAndServices();
});

async function editProvider(id) {
    document.getElementById('modalTitle').textContent = 'Edit Provider';
    document.getElementById('providerForm').reset();
    document.getElementById('providerId').value = id;
    document.getElementById('providerModal').style.display = 'flex';

    await loadCategoriesAndServices();

    try {
        const response = await fetch(`${API_BASE}/providers/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!data.success) {
            alert('Failed to load provider: ' + data.error.message);
            return;
        }

        const p = data.data;
        document.getElementById('providerName').value = p.name || '';
        document.getElementById('providerPhone').value = p.phone || '';
        document.getElementById('providerCategory').value = p.category_id || '';
        document.getElementById('providerDescription').value = p.description || '';
        document.getElementById('providerVerification').value = p.verification_status || 'pending';
        document.getElementById('providerActive').checked = !!p.active;

        const serviceIds = (p.services || []).map(String);
        document.querySelectorAll('#providerServices input[type="checkbox"]').forEach(cb => {
            cb.checked = serviceIds.includes(cb.value);
        });

        const areas = p.areas || [];
        document.querySelectorAll('#providerAreas input[type="checkbox"]').forEach(cb => {
            cb.checked = areas.includes(cb.value);
        });
    } catch (error) {
        alert('Failed to load provider details');
        console.error(error);
    }
}

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function loadCategoriesAndServices() {
    try {
        const response = await fetch(`${API_BASE}/services`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const services = data.data;
            // The DB's providers.category_id is a foreign key into services.id
            // (not a separate categories table), so this select must submit a
            // service ID — not the category label text.
            const categorySelect = document.getElementById('providerCategory');
            categorySelect.innerHTML = '<option value="">Select Primary Service</option>';
            services.forEach(s => {
                categorySelect.innerHTML += `<option value="${s.id}">${escapeHtml(s.name_hi || s.name)} (${escapeHtml(s.category)})</option>`;
            });
            
            // Populate services checkboxes (touch-friendly — no Ctrl/Cmd needed)
            const serviceGroup = document.getElementById('providerServices');
            serviceGroup.innerHTML = services.map(s => `
                <label class="checkbox-option">
                    <input type="checkbox" value="${s.id}"> ${escapeHtml(s.name_hi || s.name)}
                </label>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load services:', error);
    }
}

// Provider form submission
document.getElementById('providerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const providerId = document.getElementById('providerId').value;
    const data = {
        name: document.getElementById('providerName').value,
        phone: document.getElementById('providerPhone').value,
        category_id: document.getElementById('providerCategory').value || null,
        description: document.getElementById('providerDescription').value,
        verification_status: document.getElementById('providerVerification').value,
        active: document.getElementById('providerActive').checked,
        services: Array.from(document.querySelectorAll('#providerServices input:checked')).map(cb => parseInt(cb.value)),
        areas: Array.from(document.querySelectorAll('#providerAreas input:checked')).map(cb => cb.value)
    };
    
    try {
        const url = providerId ? `${API_BASE}/providers/${providerId}` : `${API_BASE}/providers`;
        const method = providerId ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            alert(providerId ? 'Provider updated!' : 'Provider created!');
            closeModal('providerModal');
            loadProviders();
        } else {
            alert('Failed to save provider: ' + result.error.message);
        }
    } catch (error) {
        alert('Failed to save provider');
        console.error(error);
    }
});

// Load initial data if logged in
if (authToken) {
    setTimeout(() => {
        loadDashboardData();
    }, 100);
}