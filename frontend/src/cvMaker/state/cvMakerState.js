export const CV_VIEWS = {
  dashboard: "dashboard",
  templates: "templates",
  editor: "editor",
  profile: "profile",
  settings: "settings",
  resumes: "resumes",
};

export const INITIAL_CV_DATA = {
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    github: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  experience: [
    { title: "", company: "", start: "", end: "", description: "" },
  ],
  education: [{ degree: "", school: "", year: "" }],
  skills: { technical: "", soft: "", languages: "" },
  photo: null,
};

export const INITIAL_STATE = {
  view: CV_VIEWS.dashboard,
  resumeId: null,
  resumeTitle: "",
  resumeStatus: "draft",
  templateId: "modern-minimal",
  templateFilter: "all",
  step: "personal",
  data: INITIAL_CV_DATA,
  zoom: 100,
  toast: null,
};

export function cvMakerReducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, view: action.view };
    case "SET_FILTER":
      return { ...state, templateFilter: action.filter };
    case "SELECT_TEMPLATE":
      return { ...state, templateId: action.templateId, view: CV_VIEWS.editor };
    case "LOAD_RESUME":
      return {
        ...state,
        resumeId: action.resumeId ?? null,
        resumeTitle: action.title ?? "",
        resumeStatus: action.status ?? "draft",
        templateId: action.templateId ?? state.templateId,
        data: action.data ?? state.data,
        view: CV_VIEWS.editor,
      };
    case "SET_RESUME_META":
      return {
        ...state,
        resumeTitle: action.title ?? state.resumeTitle,
        resumeStatus: action.status ?? state.resumeStatus,
      };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_DATA":
      return { ...state, data: action.data };
    case "PATCH_DATA":
      return { ...state, data: { ...state.data, ...action.patch } };
    case "PATCH_PERSONAL":
      return {
        ...state,
        data: { ...state.data, personal: { ...state.data.personal, ...action.patch } },
      };
    case "SET_ZOOM":
      return { ...state, zoom: action.zoom };
    case "TOAST":
      return { ...state, toast: action.toast };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

