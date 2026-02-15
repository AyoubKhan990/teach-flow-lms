import React from "react";
import { Helmet } from "react-helmet-async";
import { CvMakerProvider } from "./state/CvMakerProvider";
import { useCvMaker } from "./state/useCvMaker";
import { CV_VIEWS } from "./state/cvMakerState";
import { CvMakerSidebar } from "./components/CvMakerSidebar";
import { CvMakerToast } from "./components/CvMakerToast";
import { DashboardView } from "./views/DashboardView";
import { TemplatesView } from "./views/TemplatesView";
import { EditorView } from "./views/EditorView";
import { ResumesView } from "./views/ResumesView";
import { ProfileView } from "./views/ProfileView";
import { SettingsView } from "./views/SettingsView";
import styles from "./styles/cvMaker.module.css";
import "./styles/cvTemplates.css";

function CvMakerShell() {
  const { state } = useCvMaker();

  return (
    <div className="cv-maker-root">
      <Helmet>
        <title>CV Maker • TeachFlow</title>
      </Helmet>

      <div className={styles.layout}>
        <CvMakerSidebar />
        <div className={styles.content}>
          {state.view === CV_VIEWS.dashboard && <DashboardView />}
          {state.view === CV_VIEWS.templates && <TemplatesView />}
          {state.view === CV_VIEWS.editor && <EditorView />}
          {state.view === CV_VIEWS.resumes && <ResumesView />}
          {state.view === CV_VIEWS.profile && <ProfileView />}
          {state.view === CV_VIEWS.settings && <SettingsView />}
        </div>
      </div>

      <CvMakerToast />
    </div>
  );
}

export default function CvMakerApp() {
  return (
    <CvMakerProvider>
      <CvMakerShell />
    </CvMakerProvider>
  );
}

