export default async (adapter) => {
  const {
    projects: { getProjectList = () => {} } = {},
    dicom: { getStudies = () => {} } = {}
  } = adapter;

  const [projects = [], studies = []] = await Promise.all([
    getProjectList(),
    getStudies()
  ]);

  // Merging studies and projects table
  const projectsListDefault = studies
    // TODO Use ramda merge function? WG
    .map(study => [
      study,
      projects.find(({ studyUID = "" }) => study.studyUID === studyUID)
    ])
    .map(([study, project]) => ({
      ...project,
      ...study
    }))
    .filter(({ projectType }) => projectType === "Default");

  return projectsListDefault;
};
