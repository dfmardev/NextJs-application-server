export default async (adapter) => {
  console.log("queryProjectsListDefault: ", adapter);
  const {
    projects: { getProjectList = () => {} } = {},
    dicom: { getStudies = () => {} } = {}
  } = adapter;

  // TODO Do query directly getProjectList instead of filtering with javascript
  const [projects = [], studies = []] = await Promise.all([
    getProjectList({
      filter: () => {
        return true;
      }
    }),
    getStudies()
  ]);

  // Merging studies and projects table
  const projectsListDefault = studies
    // TODO Use ramda merge function? WG
    .map(study => [
      study,
      projects.find(({ studyUID = "" }) => study.studyUID === studyUID)
    ])
    // TODO Remove this?
    .filter(
      ([study, { status } = {}]) =>
        status === "Delivered" || status === "Archived"
    )
    // TODO Can remove this after default gets cleaned up. WG
    .filter(
      ([study, { projectType } = {}]) =>
        study !== undefined && projectType !== "Removed"
    )
    .map(([study, project]) => ({
      ...project,
      ...study
    }))
    .filter(({ hasProjectSnapshots = false }) => hasProjectSnapshots === true);

  return projectsListDefault;
};
