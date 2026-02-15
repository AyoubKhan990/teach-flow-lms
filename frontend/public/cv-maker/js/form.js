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
};

document.addEventListener('DOMContentLoaded', () => {
    initFormNavigation();
    initDynamicFields();
    initLivePreview();
    initPhotoUpload();
    initZoomControls();
    updateGuidance(currentStep);
    updateStepCompletion();

    const textarea = document.querySelector('textarea[name="summary"]');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    setTimeout(updatePreview, 100);
});

let alertTimer = null;

function showAlert(type, message) {
    const el = document.getElementById('form-alert');
    if (!el) return;
    el.classList.remove('hidden', 'error', 'success', 'info');
    el.classList.add(type);
    el.textContent = message;
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(() => {
        el.classList.add('hidden');
    }, 4500);
}

function updateGuidance(stepName) {
    const el = document.getElementById('form-guidance');
    if (!el) return;

    const idx = steps.indexOf(stepName);
    const stepNumber = idx >= 0 ? idx + 1 : 1;
    const titleMap = {
        personal: 'Add your key personal details',
        summary: 'Write a strong professional summary',
        experience: 'Add your most relevant experience',
        education: 'List your education and certifications',
        skills: 'Add skills recruiters scan for'
    };
    const bodyMap = {
        personal: 'Start with your name, job title, and contact details. Upload a clear square photo (optional).',
        summary: 'Keep it 3–5 lines. Mention your specialty, achievements, and what role you want.',
        experience: 'Use bullet points. Focus on impact: results, metrics, tools, and responsibilities.',
        education: 'Add degree, institution, and year. Include certifications if relevant.',
        skills: 'Add technical skills first, then soft skills. Keep it concise and specific.'
    };

    el.innerHTML = `
        <div class="title">Step ${stepNumber} of ${steps.length}: ${titleMap[stepName] || 'Build your CV'}</div>
        <div class="body">${bodyMap[stepName] || ''}</div>
    `;
}

function clearFieldError(inputEl) {
    const field = inputEl?.closest?.('.field');
    if (!field) return;
    field.classList.remove('has-error');
    const msg = field.querySelector('.field-error-text');
    if (msg) msg.remove();
}

function setFieldError(inputEl, message) {
    const field = inputEl?.closest?.('.field');
    if (!field) return;
    field.classList.add('has-error');
    let msg = field.querySelector('.field-error-text');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'field-error-text';
        field.appendChild(msg);
    }
    msg.textContent = message;
}

function isValidEmail(value) {
    const v = String(value || '').trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateStep(stepName, { decorate = true } = {}) {
    const form = document.getElementById('cv-form');
    if (!form) return { ok: true };

    const result = { ok: true, firstInvalid: null };

    if (stepName === 'personal') {
        const fullName = form.querySelector('[name="fullName"]');
        const jobTitle = form.querySelector('[name="jobTitle"]');
        const email = form.querySelector('[name="email"]');

        if (decorate) {
            clearFieldError(fullName);
            clearFieldError(jobTitle);
            clearFieldError(email);
        }

        if (!String(fullName?.value || '').trim()) {
            if (decorate) setFieldError(fullName, 'Full name is required.');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || fullName;
        }
        if (!String(jobTitle?.value || '').trim()) {
            if (decorate) setFieldError(jobTitle, 'Job title is required.');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || jobTitle;
        }
        if (!isValidEmail(email?.value)) {
            if (decorate) setFieldError(email, 'Enter a valid email address.');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || email;
        }
    }

    if (stepName === 'experience') {
        let ok = false;
        const items = document.querySelectorAll('#experience-list .dynamic-item');
        items.forEach((item) => {
            const title = item.querySelector('.inp-job');
            const company = item.querySelector('.inp-company');
            if (decorate) {
                clearFieldError(title);
                clearFieldError(company);
            }
            if (String(title?.value || '').trim() || String(company?.value || '').trim()) ok = true;
        });
        if (!ok) {
            const first = items[0]?.querySelector('.inp-job') || items[0]?.querySelector('.inp-company');
            if (decorate && first) setFieldError(first, 'Add at least one role (title or company).');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || first;
        }
    }

    if (stepName === 'education') {
        let ok = false;
        const items = document.querySelectorAll('#education-list .dynamic-item');
        items.forEach((item) => {
            const degree = item.querySelector('.inp-degree');
            const school = item.querySelector('.inp-school');
            if (decorate) {
                clearFieldError(degree);
                clearFieldError(school);
            }
            if (String(degree?.value || '').trim() || String(school?.value || '').trim()) ok = true;
        });
        if (!ok) {
            const first = items[0]?.querySelector('.inp-degree') || items[0]?.querySelector('.inp-school');
            if (decorate && first) setFieldError(first, 'Add at least one education entry.');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || first;
        }
    }

    if (stepName === 'skills') {
        const skills = form.querySelector('[name="skills"]');
        if (decorate) clearFieldError(skills);
        if (!String(skills?.value || '').trim()) {
            if (decorate) setFieldError(skills, 'Add at least a few technical skills.');
            result.ok = false;
            result.firstInvalid = result.firstInvalid || skills;
        }
    }

    return result;
}

function updateStepCompletion() {
    const stepBtns = document.querySelectorAll('.step-btn');
    stepBtns.forEach((btn) => {
        const stepName = btn.dataset.step;
        const v = validateStep(stepName, { decorate: false });
        btn.classList.toggle('complete', Boolean(v.ok));
    });
}

function initPhotoUpload() {
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const removeBtn = document.getElementById('remove-photo');

    const applyFile = (file) => {
        if (!file) return;
        if (!String(file.type || '').startsWith('image/')) {
            showAlert('error', 'Please upload an image file (PNG, JPG, WEBP).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showAlert('error', 'Image is too large. Please upload a file under 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            formData.photo = event.target.result;
            if (photoPreview) {
                photoPreview.innerHTML = `<img src="${formData.photo}" alt="Profile Photo">`;
                photoPreview.classList.add('has-photo');
            }
            if (removeBtn) removeBtn.classList.remove('hidden');
            showAlert('success', 'Photo uploaded.');
            updatePreview();
        };
        reader.readAsDataURL(file);
    };

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            applyFile(file);
        });
    }

    if (photoPreview) {
        photoPreview.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        photoPreview.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            applyFile(file);
        });
        photoPreview.addEventListener('click', () => {
            if (!formData.photo && photoInput) photoInput.click();
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            formData.photo = null;
            if (photoPreview) {
                photoPreview.innerHTML = '<i class="fas fa-user"></i><span>Add Photo</span>';
                photoPreview.classList.remove('has-photo');
            }
            removeBtn.classList.add('hidden');
            if (photoInput) photoInput.value = '';
            showAlert('info', 'Photo removed.');
            updatePreview();
        });
    }
}

function initZoomControls() {
    let zoomLevel = 100;
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomDisplay = document.getElementById('zoom-level');
    const preview = document.getElementById('cv-preview');
    const scrollArea = document.querySelector('.preview-scroll-area');

    function updateScale() {
        if (!preview || !scrollArea) return;

        const containerWidth = scrollArea.clientWidth - 64;
        const pageWidth = 794;

        let baseScale = containerWidth / pageWidth;
        if (baseScale > 1.2) baseScale = 1.2;

        const finalScale = baseScale * (zoomLevel / 100);

        preview.style.transform = `scale(${finalScale})`;
        preview.style.transformOrigin = 'top center';

        if (zoomDisplay) zoomDisplay.textContent = `${Math.round(zoomLevel)}%`;

        const scaledHeight = 1123 * finalScale;
        preview.style.marginBottom = `-${(1123 - scaledHeight)}px`;

        if (containerWidth > pageWidth * finalScale) {
            preview.style.marginLeft = '0';
        }
    }

    window.addEventListener('resize', updateScale);
    setTimeout(updateScale, 100);

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
        btn.addEventListener('click', () => {
            const target = btn.dataset.step;
            const currentIdx = steps.indexOf(currentStep);
            const targetIdx = steps.indexOf(target);
            if (targetIdx > currentIdx) {
                const v = validateStep(currentStep);
                if (!v.ok) {
                    showAlert('error', 'Fix the highlighted fields before continuing.');
                    v.firstInvalid?.focus?.();
                    return;
                }
            }
            goToStep(target);
        });
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
                const v = validateStep(currentStep);
                if (!v.ok) {
                    showAlert('error', 'Fix the highlighted fields before continuing.');
                    v.firstInvalid?.focus?.();
                    return;
                }
                updateStepCompletion();
                goToStep(steps[idx + 1]);
            } else {
                const checks = steps.map((s) => validateStep(s));
                const firstBad = checks.find((c) => !c.ok);
                if (firstBad) {
                    showAlert('error', 'Please complete the required fields before finishing.');
                    const firstInvalidStep = steps[checks.indexOf(firstBad)];
                    goToStep(firstInvalidStep);
                    firstBad.firstInvalid?.focus?.();
                    return;
                }
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
        updateGuidance(stepName);
        updateStepCompletion();
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
    if (form) {
        form.addEventListener('input', (e) => {
            clearFieldError(e.target);
            updateStepCompletion();
            updatePreview();
        });
    }
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
                        const cleanLine = line.replace(/^[•*-]\s*/, '').trim();
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

