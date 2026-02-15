import { escapeHtml } from "./escapeHtml";

function iconSvg(type) {
  const common = `class="cv-contact-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;
  switch (type) {
    case "phone":
      return `<svg ${common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.59 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.27 1.64.47 2.5.59A2 2 0 0 1 22 16.92z"/></svg>`;
    case "email":
      return `<svg ${common}><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>`;
    case "location":
      return `<svg ${common}><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    case "link":
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2c3 3.5 4.5 7 4.5 10S15 18.5 12 22"/><path d="M12 2c-3 3.5-4.5 7-4.5 10S9 18.5 12 22"/></svg>`;
    case "linkedin":
      return `<svg class="cv-contact-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.5 8.5h4V23h-4V8.5ZM8 8.5h3.8v2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.45c0-1.78-.03-4.07-2.48-4.07-2.48 0-2.86 1.94-2.86 3.94V23H8V8.5Z"/></svg>`;
    case "github":
      return `<svg class="cv-contact-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"/></svg>`;
    default:
      return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>`;
  }
}

function splitName(fullName) {
  const raw = String(fullName || "").trim();
  if (!raw) return { first: "Your", last: "Name", full: "Your Name" };
  const parts = raw.split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "", full: raw };
}

function bulletize(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("•") ? l.slice(1).trim() : l));
  if (lines.length <= 1 && !raw.includes("•")) return `<p>${escapeHtml(raw)}</p>`;
  return `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
}

function commaList(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function photoHtml(photoDataUrl) {
  if (photoDataUrl) {
    return `<img src="${escapeHtml(photoDataUrl)}" alt="Profile Photo">`;
  }
  return `<div style="opacity:.5;font-weight:700;">Photo</div>`;
}

function contactItems(personal) {
  const items = [];
  if (personal.phone) items.push({ type: "phone", label: personal.phone });
  if (personal.email) items.push({ type: "email", label: personal.email });
  if (personal.address) items.push({ type: "location", label: personal.address });
  if (personal.github) items.push({ type: "github", label: personal.github });
  if (personal.linkedin) items.push({ type: "linkedin", label: personal.linkedin });
  if (personal.website) items.push({ type: "link", label: personal.website });
  return items;
}

function experienceItems(experience) {
  const list = Array.isArray(experience) ? experience : [];
  return list
    .map((x) => ({
      title: String(x?.title || "").trim(),
      company: String(x?.company || "").trim(),
      start: String(x?.start || "").trim(),
      end: String(x?.end || "").trim(),
      description: String(x?.description || "").trim(),
    }))
    .filter((x) => x.title || x.company || x.description);
}

function educationItems(education) {
  const list = Array.isArray(education) ? education : [];
  return list
    .map((x) => ({
      degree: String(x?.degree || "").trim(),
      school: String(x?.school || "").trim(),
      year: String(x?.year || "").trim(),
    }))
    .filter((x) => x.degree || x.school || x.year);
}

export function renderCvHtml({ templateId, templateFormat, data }) {
  const personal = data?.personal || {};
  const { first, last, full } = splitName(personal.fullName);
  const jobTitle = String(personal.jobTitle || "Professional Title").trim();
  const summary = String(data?.summary || "").trim();
  const skills = data?.skills || {};
  const technicalSkills = commaList(skills.technical);
  const softSkills = commaList(skills.soft);
  const languages = commaList(skills.languages);
  const contact = contactItems(personal);
  const exp = experienceItems(data?.experience);
  const edu = educationItems(data?.education);

  const photo = photoHtml(data?.photo);

  const contactHtml = contact.length
    ? contact
        .map(
          (c) =>
            `<div class="cv-contact-item"><span class="cv-contact-icon">${iconSvg(
              c.type
            )}</span><span class="cv-contact-text">${escapeHtml(c.label)}</span></div>`
        )
        .join("")
    : `<div class="cv-contact-item"><span class="cv-contact-icon">${iconSvg(
        "email"
      )}</span><span class="cv-contact-text">email@example.com</span></div>`;

  const contactRowHtml = contact.length
    ? contact
        .map(
          (c) =>
            `<span><span class="cv-contact-icon">${iconSvg(c.type)}</span><span class="cv-contact-text">${escapeHtml(
              c.label
            )}</span></span>`
        )
        .join("")
    : `<span><span class="cv-contact-icon">${iconSvg(
        "email"
      )}</span><span class="cv-contact-text">email@example.com</span></span>`;

  const skillsHtml = technicalSkills.length
    ? technicalSkills.map((s) => `<div class="cv-skill-item">${escapeHtml(s)}</div>`).join("")
    : `<div class="cv-skill-item">Skill</div>`;

  const softSkillsHtml = softSkills.length
    ? softSkills.map((s) => `<div class="cv-skill-item">${escapeHtml(s)}</div>`).join("")
    : "";

  const languagesHtml = languages.length
    ? languages.map((s) => `<div class="cv-skill-item">${escapeHtml(s)}</div>`).join("")
    : "";

  const summaryHtml = summary ? bulletize(summary) : `<p>Write a short professional summary.</p>`;

  const expHtml = exp.length
    ? exp
        .map((item) => {
          const date = [item.start, item.end].filter(Boolean).join(" - ");
          return `
            <div class="cv-exp-item">
              <div class="cv-exp-header">
                <div class="cv-exp-company">${escapeHtml(item.company || "Company")}</div>
                <div class="cv-exp-date">${escapeHtml(date)}</div>
              </div>
              <div class="cv-exp-role">${escapeHtml(item.title || "Role")}</div>
              <div class="cv-exp-desc">${bulletize(item.description || "• Achievement / responsibility")}</div>
            </div>
          `;
        })
        .join("")
    : `
        <div class="cv-exp-item">
          <div class="cv-exp-header">
            <div class="cv-exp-company">Company</div>
            <div class="cv-exp-date">2022 - Present</div>
          </div>
          <div class="cv-exp-role">Role</div>
          <div class="cv-exp-desc"><ul><li>Achievement / responsibility</li></ul></div>
        </div>
      `;

  const eduHtml = edu.length
    ? edu
        .map((item) => {
          return `
            <div class="cv-edu-item">
              <div class="cv-exp-company">${escapeHtml(item.degree || "Degree")}</div>
              <div class="cv-exp-role">${escapeHtml(item.school || "Institution")}</div>
              <div class="cv-exp-date">${escapeHtml(item.year || "")}</div>
            </div>
          `;
        })
        .join("")
    : `
        <div class="cv-edu-item">
          <div class="cv-exp-company">Degree</div>
          <div class="cv-exp-role">Institution</div>
          <div class="cv-exp-date">Year</div>
        </div>
      `;

  const containerClass = `cv-container cv-template-${escapeHtml(templateId)}`;

  if (templateFormat === "header-top") {
    return `
      <div class="${containerClass}">
        <div class="cv-header-banner">
          <div class="cv-photo">${photo}</div>
          <div class="cv-header-info">
            <h1 class="cv-name"><span class="cv-name-first">${escapeHtml(first)}</span> ${escapeHtml(last)}</h1>
            <div class="cv-role">${escapeHtml(jobTitle)}</div>
            <div class="cv-contact-row">${contactRowHtml}</div>
          </div>
        </div>
        <div class="cv-body">
          <div class="cv-main">
            <div class="cv-section">
              <div class="cv-section-title">Profile</div>
              <div class="cv-exp-desc">${summaryHtml}</div>
            </div>
            <div class="cv-section">
              <div class="cv-section-title">Experience</div>
              ${expHtml}
            </div>
          </div>
          <div class="cv-sidebar-right">
            <div class="cv-section">
              <div class="cv-sidebar-title">Contact</div>
              ${contactHtml}
            </div>
            <div class="cv-section">
              <div class="cv-sidebar-title">Education</div>
              ${eduHtml}
            </div>
            <div class="cv-section">
              <div class="cv-sidebar-title">Skills</div>
              ${skillsHtml}
              ${softSkillsHtml}
            </div>
            ${languagesHtml ? `<div class="cv-section"><div class="cv-sidebar-title">Languages</div>${languagesHtml}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  if (templateFormat === "centered") {
    return `
      <div class="${containerClass}">
        <div class="cv-header-centered">
          <div class="cv-photo">${photo}</div>
          <h1 class="cv-name">${escapeHtml(full)}</h1>
          <div class="cv-role">${escapeHtml(jobTitle)}</div>
          <div class="cv-contact-row">${contactRowHtml}</div>
        </div>
        <div class="cv-body">
          <div class="cv-section">
            <div class="cv-section-title">Profile</div>
            <div class="cv-exp-desc">${summaryHtml}</div>
          </div>
          <div class="cv-section">
            <div class="cv-section-title">Experience</div>
            ${expHtml}
          </div>
          <div class="cv-section">
            <div class="cv-section-title">Education</div>
            ${eduHtml}
          </div>
          <div class="cv-section">
            <div class="cv-section-title">Skills</div>
            <div class="cv-exp-desc">${skillsHtml}${softSkillsHtml}</div>
          </div>
          ${languagesHtml ? `<div class="cv-section"><div class="cv-section-title">Languages</div><div class="cv-exp-desc">${languagesHtml}</div></div>` : ""}
        </div>
      </div>
    `;
  }

  const sidebarFirst = templateFormat !== "sidebar-right";

  return `
    <div class="${containerClass}">
      <div class="cv-sidebar" style="${sidebarFirst ? "" : "order:2;"}">
        <div class="cv-photo">${photo}</div>
        <div class="cv-sidebar-section">
          <div class="cv-sidebar-title">Contact</div>
          ${contactHtml}
        </div>
        <div class="cv-sidebar-section">
          <div class="cv-sidebar-title">Skills</div>
          ${skillsHtml}
          ${softSkillsHtml}
        </div>
        ${languagesHtml ? `<div class="cv-sidebar-section"><div class="cv-sidebar-title">Languages</div>${languagesHtml}</div>` : ""}
      </div>
      <div class="cv-main" style="${sidebarFirst ? "" : "order:1;"}">
        <div class="cv-main-header">
          <h1 class="cv-name"><span class="cv-name-first">${escapeHtml(first)}</span> ${escapeHtml(last)}</h1>
          <div class="cv-role">${escapeHtml(jobTitle)}</div>
        </div>
        <div class="cv-section">
          <div class="cv-section-title">Profile</div>
          <div class="cv-exp-desc">${summaryHtml}</div>
        </div>
        <div class="cv-section">
          <div class="cv-section-title">Experience</div>
          ${expHtml}
        </div>
        <div class="cv-section">
          <div class="cv-section-title">Education</div>
          ${eduHtml}
        </div>
      </div>
    </div>
  `;
}

