import { escapeHtml } from "./escapeHtml";
import { CV_AVATAR_IMAGES } from "../data/templates";

const SAMPLE_DATA = [
  { name: "Richard Sanchez", role: "Marketing Manager" },
  { name: "Emily Johnson", role: "Senior Accountant" },
  { name: "Michael Chen", role: "Creative Director" },
  { name: "Sarah Williams", role: "Software Engineer" },
  { name: "James Anderson", role: "CEO & Founder" },
  { name: "Jessica Taylor", role: "UX Designer" },
  { name: "David Miller", role: "Graphic Designer" },
  { name: "Dr. Amanda Brown", role: "Research Prof." },
  { name: "Thomas Wilson", role: "Project Manager" },
  { name: "Laura Martinez", role: "Data Analyst" },
  { name: "Robert Davis", role: "Operations Lead" },
  { name: "Sophie Garcia", role: "Product Manager" },
];

export function formatClass(format) {
  switch (format) {
    case "sidebar-left":
      return "format-sidebar-left";
    case "header-top":
      return "format-header-top";
    case "centered":
      return "format-centered";
    case "sidebar-right":
      return "format-sidebar-right";
    default:
      return "format-sidebar-left";
  }
}

export function renderMiniTemplateHTML(template, index) {
  const avatar = CV_AVATAR_IMAGES[index % CV_AVATAR_IMAGES.length];
  const sample = SAMPLE_DATA[index % SAMPLE_DATA.length];
  const theme = escapeHtml(template?.color || "#1e3a5f");
  const photoHTML = `<img src="${escapeHtml(
    avatar
  )}" alt="Profile" onerror="this.parentElement.innerHTML='&lt;div class=\\'mini-avatar-fallback\\'&gt;User&lt;/div&gt;'">`;

  const name = escapeHtml(sample.name);
  const role = escapeHtml(sample.role);

  switch (template.format) {
    case "sidebar-left":
      return `
        <div class="mini-sidebar" style="background:${theme};">
          <div class="mini-photo">${photoHTML}</div>
          <div class="mini-section-title">Contact</div>
          <div class="mini-contact-item">+123-456-7890</div>
          <div class="mini-contact-item">email@site.com</div>
          <div class="mini-section-title">Skills</div>
          <div class="mini-skill">Leadership</div>
          <div class="mini-skill">Communication</div>
          <div class="mini-skill">Strategy</div>
        </div>
        <div class="mini-main">
          <div class="mini-name">${name}</div>
          <div class="mini-role">${role}</div>
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
    case "header-top":
      return `
        <div class="mini-header-banner" style="background:${theme};">
          <div class="mini-photo">${photoHTML}</div>
          <div>
            <div class="mini-name">${name}</div>
            <div class="mini-role">${role}</div>
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
    case "centered":
      return `
        <div class="mini-header-centered" style="border-color:${theme};">
          <div class="mini-photo" style="margin: 0 auto 6px;">${photoHTML}</div>
          <div class="mini-name">${name}</div>
          <div class="mini-role">${role}</div>
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
    case "sidebar-right":
      return `
        <div class="mini-main" style="order: 1;">
          <div class="mini-name">${name}</div>
          <div class="mini-role">${role}</div>
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
        <div class="mini-sidebar" style="order: 2;background:${theme};">
          <div class="mini-photo">${photoHTML}</div>
          <div class="mini-section-title">Contact</div>
          <div class="mini-contact-item">+123-456</div>
          <div class="mini-contact-item">email</div>
          <div class="mini-section-title">Skills</div>
          <div class="mini-skill">Coding</div>
          <div class="mini-skill">Design</div>
        </div>
      `;
    default:
      return renderMiniTemplateHTML({ ...template, format: "sidebar-left" }, index);
  }
}

