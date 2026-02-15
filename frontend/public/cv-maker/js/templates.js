const templates = [
    { id: 'modern-minimal', name: 'Modern Minimal', category: 'modern', color: '#1e3a5f', format: 'sidebar-left', avatar: 1 },
    { id: 'professional-classic', name: 'Professional Classic', category: 'professional', color: '#2c3e50', format: 'sidebar-left', avatar: 2 },
    { id: 'creative-bold', name: 'Creative Bold', category: 'creative', color: '#e74c3c', format: 'sidebar-left', avatar: 3 },
    { id: 'tech-developer', name: 'Tech Developer', category: 'modern', color: '#238636', format: 'sidebar-left', avatar: 4 },
    { id: 'executive', name: 'Executive', category: 'professional', color: '#1a1a2e', format: 'header-top', avatar: 5 },
    { id: 'fresh-graduate', name: 'Fresh Graduate', category: 'simple', color: '#00b894', format: 'header-top', avatar: 6 },
    { id: 'designer-portfolio', name: 'Designer Portfolio', category: 'creative', color: '#e17055', format: 'centered', avatar: 7 },
    { id: 'academic', name: 'Academic', category: 'simple', color: '#34495e', format: 'centered', avatar: 8 },
    { id: 'compact', name: 'Compact', category: 'modern', color: '#27ae60', format: 'sidebar-right', avatar: 9 },
    { id: 'two-column', name: 'Two Column', category: 'standard', color: '#2980b9', format: 'header-top', avatar: 10 },
    { id: 'timeline', name: 'Timeline', category: 'creative', color: '#943126', format: 'centered', avatar: 11 },
    { id: 'infographic', name: 'Infographic', category: 'creative', color: '#f39c12', format: 'sidebar-left', avatar: 12 }
];

const avatarImages = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face'
];

const sampleData = [
    { name: 'Richard Sanchez', role: 'Marketing Manager' },
    { name: 'Emily Johnson', role: 'Senior Accountant' },
    { name: 'Michael Chen', role: 'Creative Director' },
    { name: 'Sarah Williams', role: 'Software Engineer' },
    { name: 'James Anderson', role: 'CEO & Founder' },
    { name: 'Jessica Taylor', role: 'UX Designer' },
    { name: 'David Miller', role: 'Graphic Designer' },
    { name: 'Dr. Amanda Brown', role: 'Research Prof.' },
    { name: 'Thomas Wilson', role: 'Project Manager' },
    { name: 'Laura Martinez', role: 'Data Analyst' },
    { name: 'Robert Davis', role: 'Operations Lead' },
    { name: 'Sophie Garcia', role: 'Product Manager' }
];

function generatePreviewHTML(template, index) {
    const avatar = avatarImages[index % avatarImages.length];
    const sample = sampleData[index % sampleData.length];
    const photoHTML = `<img src="${avatar}" alt="Profile" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;

    switch (template.format) {
        case 'sidebar-left':
            return `
                <div class="mini-sidebar">
                    <div class="mini-photo">${photoHTML}</div>
                    <div class="mini-section-title">Contact</div>
                    <div class="mini-contact-item"><i class="fas fa-phone"></i> +123-456-7890</div>
                    <div class="mini-contact-item"><i class="fas fa-envelope"></i> email@site.com</div>
                    <div class="mini-section-title">Skills</div>
                    <div class="mini-skill">Leadership</div>
                    <div class="mini-skill">Communication</div>
                    <div class="mini-skill">Strategy</div>
                </div>
                <div class="mini-main">
                    <div class="mini-name">${sample.name}</div>
                    <div class="mini-role">${sample.role}</div>
                    <div class="mini-main-section">
                        <div class="mini-main-title">Profile</div>
                        <div class="mini-exp-desc">Creative professional with extensive industry experience.</div>
                    </div>
                    <div class="mini-main-section">
                        <div class="mini-main-title">Experience</div>
                        <div class="mini-exp-item">
                            <div class="mini-exp-company">Borcelle Studio</div>
                            <div class="mini-exp-role">Senior Position</div>
                        </div>
                    </div>
                </div>
            `;

        case 'header-top':
            return `
                <div class="mini-header-banner">
                    <div class="mini-photo">${photoHTML}</div>
                    <div>
                        <div class="mini-name">${sample.name}</div>
                        <div class="mini-role">${sample.role}</div>
                    </div>
                </div>
                <div class="mini-main" style="padding-top: 8px;">
                    <div class="mini-main-section">
                        <div class="mini-main-title">Profile</div>
                        <div class="mini-exp-desc">Accomplished professional with expertise in management and strategy.</div>
                    </div>
                    <div class="mini-main-section">
                        <div class="mini-main-title">Experience</div>
                        <div class="mini-exp-item">
                            <div class="mini-exp-company">Global Corp Inc.</div>
                            <div class="mini-exp-role">Director of Operations</div>
                        </div>
                    </div>
                </div>
            `;

        case 'centered':
            return `
                <div class="mini-header-centered">
                    <div class="mini-photo" style="margin: 0 auto 6px;">${photoHTML}</div>
                    <div class="mini-name">${sample.name}</div>
                    <div class="mini-role">${sample.role}</div>
                </div>
                <div class="mini-main" style="padding-top: 8px; text-align: left;">
                    <div class="mini-main-section">
                        <div class="mini-main-title">About</div>
                        <div class="mini-exp-desc">Innovative thinker with a passion for delivering excellence.</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <div class="mini-main-section">
                            <div class="mini-main-title">Experience</div>
                            <div class="mini-exp-company" style="font-size: 5px;">Studio Creative</div>
                        </div>
                        <div class="mini-main-section">
                            <div class="mini-main-title">Education</div>
                            <div class="mini-exp-company" style="font-size: 5px;">University</div>
                        </div>
                    </div>
                </div>
            `;

        case 'sidebar-right':
            return `
                <div class="mini-main" style="order: 1;">
                    <div class="mini-name">${sample.name}</div>
                    <div class="mini-role">${sample.role}</div>
                    <div class="mini-main-section" style="margin-top: 8px;">
                        <div class="mini-main-title">Profile</div>
                        <div class="mini-exp-desc">Results-driven professional with proven track record.</div>
                    </div>
                    <div class="mini-main-section">
                        <div class="mini-main-title">Experience</div>
                        <div class="mini-exp-item">
                            <div class="mini-exp-company">Tech Solutions</div>
                            <div class="mini-exp-role">Lead Developer</div>
                        </div>
                    </div>
                </div>
                <div class="mini-sidebar" style="order: 2;">
                    <div class="mini-photo">${photoHTML}</div>
                    <div class="mini-section-title">Contact</div>
                    <div class="mini-contact-item"><i class="fas fa-phone"></i> +123-456</div>
                    <div class="mini-contact-item"><i class="fas fa-envelope"></i> email</div>
                    <div class="mini-section-title">Skills</div>
                    <div class="mini-skill">Coding</div>
                    <div class="mini-skill">Design</div>
                </div>
            `;

        default:
            return generatePreviewHTML({ ...template, format: 'sidebar-left' }, index);
    }
}

function getFormatClass(format) {
    switch (format) {
        case 'sidebar-left': return 'format-sidebar-left';
        case 'header-top': return 'format-header-top';
        case 'centered': return 'format-centered';
        case 'sidebar-right': return 'format-sidebar-right';
        default: return 'format-sidebar-left';
    }
}

function createTemplateCard(template, index) {
    const div = document.createElement('div');
    div.className = 'template-card';
    div.onclick = () => selectTemplate(template.id);

    const formatClass = getFormatClass(template.format);

    div.innerHTML = `
        <div class="template-preview-box">
            <div class="mini-cv ${formatClass} cv-style-${template.id}">
                ${generatePreviewHTML(template, index)}
            </div>
            <div class="hover-overlay">
                <span class="select-btn">Use This Template</span>
            </div>
        </div>
        <div class="template-content">
            <h3 class="template-title">${template.name}</h3>
            <span class="template-tag">${template.category.charAt(0).toUpperCase() + template.category.slice(1)}</span>
        </div>
    `;

    return div;
}

window.renderTemplates = function (filter = 'all') {
    const container = document.getElementById('all-templates');
    const featuredContainer = document.getElementById('featured-templates');

    if (container) container.innerHTML = '';
    if (featuredContainer) featuredContainer.innerHTML = '';

    const filtered = filter === 'all'
        ? templates
        : templates.filter(t => t.category === filter);

    filtered.forEach((t, index) => {
        const card = createTemplateCard(t, index);
        if (container) container.appendChild(card);
    });

    if (featuredContainer) {
        templates.slice(0, 4).forEach((t, index) => {
            const card = createTemplateCard(t, index);
            featuredContainer.appendChild(card);
        });
    }
};

function selectTemplate(id) {
    if (window.navigateTo && window.setTemplate) {
        window.setTemplate(id);
        window.navigateTo('editor');
    } else {
        alert('Error loading editor. Please refresh the page.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.renderTemplates();
});

