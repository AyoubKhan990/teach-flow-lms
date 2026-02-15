// Form State
const formData = {
    personal: {},
    summary: '',
    experience: [],
    education: [],
    skills: {},
    photo: null
};

let currentStep = 'personal';
const steps = ['personal', 'summary', 'experience', 'education', 'skills'];
let selectedTemplateId = 'modern-minimal';

// Template format mapping
const templateFormats = {
    'modern-minimal': 'sidebar-left',
    'professional-classic': 'sidebar-left',
    'creative-bold': 'sidebar-left',
    'tech-developer': 'sidebar-left',
    'executive': 'header-top',
    'fresh-graduate': 'header-top',
    'designer-portfolio': 'centered',
    'academic': 'centered',
    'compact': 'sidebar-right',
    'two-column': 'header-top',
    'timeline': 'centered',
    'infographic': 'sidebar-left'
};

window.setTemplate = function (templateId) {
    selectedTemplateId = templateId;
    const nameDisplay = document.getElementById('selected-template-name');
    if (nameDisplay) {
        const formattedName = templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        nameDisplay.innerText = 'Template: ' + formattedName;
    }
    updatePreview();
}

document.addEventListener('DOMContentLoaded', () => {
    initFormNavigation();
    initDynamicFields();
    initLivePreview();
    initPhotoUpload();
    initZoomControls();

    const textarea = document.querySelector('textarea[name="summary"]');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    setTimeout(updatePreview, 100);
});

function initPhotoUpload() {
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const removeBtn = document.getElementById('remove-photo');

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    formData.photo = event.target.result;
                    photoPreview.innerHTML = `<img src="${formData.photo}" alt="Profile Photo">`;
                    photoPreview.classList.add('has-photo');
                    if (removeBtn) removeBtn.classList.remove('hidden');
                    updatePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            formData.photo = null;
            photoPreview.innerHTML = '<i class="fas fa-user"></i><span>Add Photo</span>';
            photoPreview.classList.remove('has-photo');
            removeBtn.classList.add('hidden');
            if (photoInput) photoInput.value = '';
            updatePreview();
        });
    }
}

function initZoomControls() {
    let zoomLevel = 100; // Start at 100% relative to container width
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomDisplay = document.getElementById('zoom-level');
    const preview = document.getElementById('cv-preview');
    const scrollArea = document.querySelector('.preview-scroll-area');

    function updateScale() {
        if (!preview || !scrollArea) return;

        // Container width available for the page (minus padding)
        const containerWidth = scrollArea.clientWidth - 64; // 32px padding * 2

        // Logical width of A4 page in CSS pixels (approx)
        // 210mm * 3.78px/mm = 793.8px
        const pageWidth = 794;

        // Calculate base scale to fit width
        // If container is smaller than page, scale down. If larger, max at 1.
        let baseScale = containerWidth / pageWidth;
        if (baseScale > 1.2) baseScale = 1.2; // Limit max initial scale

        // Apply zoom level factor
        const finalScale = baseScale * (zoomLevel / 100);

        // Apply scaling
        preview.style.transform = `scale(${finalScale})`;
        preview.style.transformOrigin = 'top center';

        // Update display text
        if (zoomDisplay) zoomDisplay.textContent = `${Math.round(zoomLevel)}%`;

        // Adjust marginBottom to account for scaled height
        const scaledHeight = 1123 * finalScale; // A4 height approx
        preview.style.marginBottom = `-${(1123 - scaledHeight)}px`;

        // Fix for centering logic in flex container
        if (containerWidth > pageWidth * finalScale) {
            preview.style.marginLeft = '0';
        }
    }

    // Initial scale
    window.addEventListener('resize', updateScale);
    // Slight delay to ensure layout is ready
    setTimeout(updateScale, 100);

    // Observer for sidebar toggle or other layout changes
    const observer = new ResizeObserver(updateScale);
    if (scrollArea) observer.observe(scrollArea);


    if (zoomIn && zoomOut && preview) {
        zoomIn.addEventListener('click', () => {
            if (zoomLevel < 200) {
                zoomLevel += 10;
                updateScale();
            }
        });

        zoomOut.addEventListener('click', () => {
            if (zoomLevel > 30) {
                zoomLevel -= 10;
                updateScale();
            }
        });
    }
}

function initFormNavigation() {
    const stepBtns = document.querySelectorAll('.step-btn');
    const sections = document.querySelectorAll('.form-step');
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');

    stepBtns.forEach(btn => {
        btn.addEventListener('click', () => goToStep(btn.dataset.step));
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const idx = steps.indexOf(currentStep);
            if (idx > 0) goToStep(steps[idx - 1]);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const idx = steps.indexOf(currentStep);
            if (idx < steps.length - 1) {
                goToStep(steps[idx + 1]);
            } else {
                if (window.downloadPDF) window.downloadPDF();
                else alert('CV is ready! Click Download PDF to save.');
            }
        });
    }

    function goToStep(stepName) {
        currentStep = stepName;
        stepBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.step === stepName));
        sections.forEach(sec => sec.classList.toggle('hidden', sec.id !== `step-${stepName}`));
        const idx = steps.indexOf(stepName);
        if (prevBtn) prevBtn.classList.toggle('hidden', idx === 0);
        if (nextBtn) {
            nextBtn.innerHTML = idx === steps.length - 1
                ? '<i class="fas fa-check"></i> Finish'
                : 'Next <i class="fas fa-arrow-right"></i>';
        }
    }
}

function initDynamicFields() {
    const addExpBtn = document.getElementById('add-experience');
    const expList = document.getElementById('experience-list');
    if (addExpBtn && expList) {
        addExpBtn.addEventListener('click', () => addExperienceItem(expList));
        addExperienceItem(expList);
    }

    const addEduBtn = document.getElementById('add-education');
    const eduList = document.getElementById('education-list');
    if (addEduBtn && eduList) {
        addEduBtn.addEventListener('click', () => addEducationItem(eduList));
        addEducationItem(eduList);
    }
}

function addExperienceItem(container) {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <button type="button" class="btn-remove-item" onclick="this.parentElement.remove(); updatePreview();"><i class="fas fa-trash"></i></button>
        <div class="field">
            <label>Job Title</label>
            <input type="text" class="inp-job" placeholder="Marketing Manager & Specialist">
        </div>
        <div class="field">
            <label>Company</label>
            <input type="text" class="inp-company" placeholder="Borcelle Studio">
        </div>
        <div class="form-group two-col">
            <div class="field">
                <label>Start Date</label>
                <input type="text" class="inp-start" placeholder="2020">
            </div>
            <div class="field">
                <label>End Date</label>
                <input type="text" class="inp-end" placeholder="Present">
            </div>
        </div>
        <div class="field">
            <div class="section-header-small">
                <label>Description (Use • for bullet points)</label>
                <button type="button" class="btn-ai-small ai-generate-exp">
                    <i class="fas fa-wand-magic-sparkles"></i> AI Generate
                </button>
            </div>
            <textarea class="inp-desc" rows="4" placeholder="• Develop and execute marketing strategies&#10;• Lead high-performing team&#10;• Monitor brand consistency"></textarea>
        </div>
    `;
    container.appendChild(div);
    div.querySelectorAll('input, textarea').forEach(inp => inp.addEventListener('input', updatePreview));
}

function addEducationItem(container) {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <button type="button" class="btn-remove-item" onclick="this.parentElement.remove(); updatePreview();"><i class="fas fa-trash"></i></button>
        <div class="field">
            <label>Degree/Certificate</label>
            <input type="text" class="inp-degree" placeholder="Master of Business Management">
        </div>
        <div class="field">
            <label>Institution</label>
            <input type="text" class="inp-school" placeholder="Wardiere University">
        </div>
        <div class="field">
            <label>Year</label>
            <input type="text" class="inp-year" placeholder="2018 - 2022">
        </div>
    `;
    container.appendChild(div);
    div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updatePreview));
}

function initLivePreview() {
    const form = document.getElementById('cv-form');
    if (form) form.addEventListener('input', updatePreview);
}

window.updatePreview = updatePreview;

function updatePreview() {
    const form = document.getElementById('cv-form');
    if (!form) return;

    formData.personal = {
        fullName: form.querySelector('[name="fullName"]')?.value || '',
        jobTitle: form.querySelector('[name="jobTitle"]')?.value || '',
        email: form.querySelector('[name="email"]')?.value || '',
        phone: form.querySelector('[name="phone"]')?.value || '',
        address: form.querySelector('[name="address"]')?.value || '',
        linkedin: form.querySelector('[name="linkedin"]')?.value || '',
        website: form.querySelector('[name="website"]')?.value || '',
    };

    formData.summary = form.querySelector('[name="summary"]')?.value || '';

    formData.experience = [];
    document.querySelectorAll('#experience-list .dynamic-item').forEach(item => {
        formData.experience.push({
            title: item.querySelector('.inp-job')?.value || '',
            company: item.querySelector('.inp-company')?.value || '',
            start: item.querySelector('.inp-start')?.value || '',
            end: item.querySelector('.inp-end')?.value || '',
            description: item.querySelector('.inp-desc')?.value || ''
        });
    });

    formData.education = [];
    document.querySelectorAll('#education-list .dynamic-item').forEach(item => {
        formData.education.push({
            degree: item.querySelector('.inp-degree')?.value || '',
            school: item.querySelector('.inp-school')?.value || '',
            year: item.querySelector('.inp-year')?.value || ''
        });
    });

    formData.skills = {
        technical: form.querySelector('[name="skills"]')?.value || '',
        soft: form.querySelector('[name="softSkills"]')?.value || '',
        languages: form.querySelector('[name="languages"]')?.value || ''
    };

    renderCV();
}

function renderCV() {
    const container = document.getElementById('cv-preview');
    if (!container) return;

    const format = templateFormats[selectedTemplateId] || 'sidebar-left';
    const templateClass = `cv-template-${selectedTemplateId}`;

    const name = formData.personal.fullName || 'Your Name';
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || 'Your';
    const lastName = nameParts.slice(1).join(' ') || (formData.personal.fullName ? '' : 'Name');
    const role = formData.personal.jobTitle || 'Professional Title';

    const photoHTML = formData.photo
        ? `<img src="${formData.photo}" alt="Profile Photo">`
        : '<i class="fas fa-user"></i>';

    // Build common elements
    const contactItems = buildContactHTML();
    const eduItems = buildEducationHTML();
    const skillsItems = buildSkillsHTML();
    const languagesItems = buildLanguagesHTML();
    const experienceItems = buildExperienceHTML();

    let html = '';

    switch (format) {
        case 'sidebar-left':
            html = renderSidebarLeft(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems);
            break;
        case 'header-top':
            html = renderHeaderTop(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems);
            break;
        case 'centered':
            html = renderCentered(templateClass, photoHTML, name, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems);
            break;
        case 'sidebar-right':
            html = renderSidebarRight(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems);
            break;
        default:
            html = renderSidebarLeft(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems);
    }

    container.innerHTML = html;
}

function buildContactHTML() {
    let html = '';
    if (formData.personal.phone) html += `<div class="cv-contact-item"><i class="fas fa-phone"></i><span>${formData.personal.phone}</span></div>`;
    if (formData.personal.email) html += `<div class="cv-contact-item"><i class="fas fa-envelope"></i><span>${formData.personal.email}</span></div>`;
    if (formData.personal.address) html += `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i><span>${formData.personal.address}</span></div>`;
    if (formData.personal.website) html += `<div class="cv-contact-item"><i class="fas fa-globe"></i><span>${formData.personal.website}</span></div>`;
    if (formData.personal.linkedin) html += `<div class="cv-contact-item"><i class="fab fa-linkedin"></i><span>${formData.personal.linkedin}</span></div>`;
    return html;
}

function buildContactRowHTML() {
    let items = [];
    if (formData.personal.phone) items.push(`<span><i class="fas fa-phone"></i> ${formData.personal.phone}</span>`);
    if (formData.personal.email) items.push(`<span><i class="fas fa-envelope"></i> ${formData.personal.email}</span>`);
    if (formData.personal.address) items.push(`<span><i class="fas fa-map-marker-alt"></i> ${formData.personal.address}</span>`);
    if (formData.personal.website) items.push(`<span><i class="fas fa-globe"></i> ${formData.personal.website}</span>`);
    return items.join('');
}

function buildEducationHTML() {
    let html = '';
    formData.education.forEach(edu => {
        if (edu.school || edu.degree) {
            html += `
                <div class="cv-edu-item">
                    <div class="cv-edu-year">${edu.year || ''}</div>
                    <div class="cv-edu-school">${edu.school || 'University'}</div>
                    <div class="cv-edu-degree">• ${edu.degree || 'Degree'}</div>
                </div>
            `;
        }
    });
    return html;
}

function buildSkillsHTML() {
    let html = '';
    const allSkills = [];
    if (formData.skills.technical) allSkills.push(...formData.skills.technical.split(',').map(s => s.trim()).filter(s => s));
    if (formData.skills.soft) allSkills.push(...formData.skills.soft.split(',').map(s => s.trim()).filter(s => s));
    allSkills.forEach(skill => html += `<div class="cv-skill-item">${skill}</div>`);
    return html;
}

function buildLanguagesHTML() {
    let html = '';
    if (formData.skills.languages) {
        formData.skills.languages.split(',').map(s => s.trim()).filter(s => s).forEach(lang => {
            html += `<div class="cv-skill-item">${lang}</div>`;
        });
    }
    return html;
}

function buildExperienceHTML() {
    let html = '';
    formData.experience.forEach(exp => {
        if (exp.title || exp.company) {
            let descHTML = '';
            if (exp.description) {
                const lines = exp.description.split('\n').filter(l => l.trim());
                if (lines.length > 0) {
                    descHTML = '<div class="cv-exp-desc"><ul>';
                    lines.forEach(line => {
                        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                        if (cleanLine) descHTML += `<li>${cleanLine}</li>`;
                    });
                    descHTML += '</ul></div>';
                }
            }

            html += `
                <div class="cv-exp-item">
                    <div class="cv-exp-header">
                        <span class="cv-exp-company">${exp.company || 'Company'}</span>
                        <span class="cv-exp-date">${exp.start}${exp.start && exp.end ? ' - ' : ''}${exp.end}</span>
                    </div>
                    <div class="cv-exp-role">${exp.title || 'Position'}</div>
                    ${descHTML}
                </div>
            `;
        }
    });
    return html;
}

// FORMAT 1: Sidebar Left
function renderSidebarLeft(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems) {
    return `
        <div class="cv-container ${templateClass}">
            <div class="cv-sidebar">
                <div class="cv-photo">${photoHTML}</div>
                ${contactItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Contact</div><div class="cv-sidebar-content">${contactItems}</div></div>` : ''}
                ${eduItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Education</div><div class="cv-sidebar-content">${eduItems}</div></div>` : ''}
                ${skillsItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Skills</div><div class="cv-sidebar-content">${skillsItems}</div></div>` : ''}
                ${languagesItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Languages</div><div class="cv-sidebar-content">${languagesItems}</div></div>` : ''}
            </div>
            <div class="cv-main">
                <div class="cv-main-header">
                    <h1 class="cv-name"><span class="cv-name-first">${firstName}</span> ${lastName}</h1>
                    <div class="cv-role">${role}</div>
                </div>
                ${formData.summary ? `<div class="cv-section"><h2 class="cv-section-title">Profile</h2><p>${formData.summary}</p></div>` : ''}
                ${experienceItems ? `<div class="cv-section"><h2 class="cv-section-title">Work Experience</h2>${experienceItems}</div>` : ''}
            </div>
        </div>
    `;
}

// FORMAT 2: Header Top
function renderHeaderTop(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems) {
    const contactRow = buildContactRowHTML();
    return `
        <div class="cv-container ${templateClass}">
            <div class="cv-header-banner">
                <div class="cv-photo">${photoHTML}</div>
                <div class="cv-header-info">
                    <h1 class="cv-name">${firstName} ${lastName}</h1>
                    <div class="cv-role">${role}</div>
                    ${contactRow ? `<div class="cv-contact-row">${contactRow}</div>` : ''}
                </div>
            </div>
            <div class="cv-body">
                <div class="cv-main">
                    ${formData.summary ? `<div class="cv-section"><h2 class="cv-section-title">Profile</h2><p>${formData.summary}</p></div>` : ''}
                    ${experienceItems ? `<div class="cv-section"><h2 class="cv-section-title">Work Experience</h2>${experienceItems}</div>` : ''}
                </div>
                <div class="cv-sidebar-right">
                    ${eduItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Education</div>${eduItems}</div>` : ''}
                    ${skillsItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Skills</div>${skillsItems}</div>` : ''}
                    ${languagesItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Languages</div>${languagesItems}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// FORMAT 3: Centered
function renderCentered(templateClass, photoHTML, name, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems) {
    const contactRow = buildContactRowHTML();
    return `
        <div class="cv-container ${templateClass}">
            <div class="cv-header-centered">
                <div class="cv-photo">${photoHTML}</div>
                <h1 class="cv-name">${name}</h1>
                <div class="cv-role">${role}</div>
                ${contactRow ? `<div class="cv-contact-row">${contactRow}</div>` : ''}
            </div>
            <div class="cv-body">
                <div class="cv-main">
                    ${formData.summary ? `<div class="cv-section"><h2 class="cv-section-title">Profile</h2><p>${formData.summary}</p></div>` : ''}
                    ${experienceItems ? `<div class="cv-section"><h2 class="cv-section-title">Work Experience</h2>${experienceItems}</div>` : ''}
                </div>
                <div class="cv-sidebar-right">
                    ${eduItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Education</div>${eduItems}</div>` : ''}
                    ${skillsItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Skills</div>${skillsItems}</div>` : ''}
                    ${languagesItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Languages</div>${languagesItems}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// FORMAT 4: Sidebar Right
function renderSidebarRight(templateClass, photoHTML, firstName, lastName, role, contactItems, eduItems, skillsItems, languagesItems, experienceItems) {
    return `
        <div class="cv-container ${templateClass}">
            <div class="cv-main">
                <div class="cv-main-header">
                    <h1 class="cv-name">${firstName} ${lastName}</h1>
                    <div class="cv-role">${role}</div>
                </div>
                ${formData.summary ? `<div class="cv-section"><h2 class="cv-section-title">Profile</h2><p>${formData.summary}</p></div>` : ''}
                ${experienceItems ? `<div class="cv-section"><h2 class="cv-section-title">Work Experience</h2>${experienceItems}</div>` : ''}
                ${eduItems ? `<div class="cv-section"><h2 class="cv-section-title">Education</h2>${eduItems}</div>` : ''}
            </div>
            <div class="cv-sidebar">
                <div class="cv-photo">${photoHTML}</div>
                ${contactItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Contact</div><div class="cv-sidebar-content">${contactItems}</div></div>` : ''}
                ${skillsItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Skills</div><div class="cv-sidebar-content">${skillsItems}</div></div>` : ''}
                ${languagesItems ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Languages</div><div class="cv-sidebar-content">${languagesItems}</div></div>` : ''}
            </div>
        </div>
    `;
}
