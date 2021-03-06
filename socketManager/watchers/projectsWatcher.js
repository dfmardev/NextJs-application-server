import { payloadProjects } from "../../actions";

import queryProjectsListDefault from "../../helpers/queryProjectsListDefault";
import filterProjectsByUser from "../../helpers/filterProjectsByUser";

export default ({ io, adapter = {} }) => {
  const {
    users: { getUsers = () => {} } = {},
    projects: { getProjectList = () => {} } = {},
    dicom: { getStudies } = {}
  } = adapter;

  const intervalSeconds = 30;

  const intervalFunc = async () => {
    // TODO Do query directly getProjectList instead of filtering with javascript?
    const [projects = [], studies = []] = await Promise.all([
      getProjectList(),
      getStudies()
    ]);

    // Merging studies and projects table
    const projectsList = await Promise.all(
      studies
        .map(study => [
          study,
          projects.find(({ studyUID = "" }) => study.studyUID === studyUID)
        ])
        .filter(
          ([study, { deleted = false } = {}]) =>
            study !== undefined && deleted !== true
        )
    );

    const sockets = Object.values(io.sockets.sockets);
    await Promise.all(
      sockets.map(async socket => {
        const {
          request: { session: { passport: { user } = {} } = {} } = {}
        } = socket;

        const { role, userID, teams = [] } = user || {};

        // TODO Wrap this code block this is reusable
        const users = await getUsers();
        const usersSelected =
          role === "admin"
            ? users
            : teams.reduce((a, v) => {
                const { isTeamAdmin = false, id } = v;
                const ret = isTeamAdmin
                  ? users.filter(({ teams = [] }) =>
                      teams.some(v => v.id === id)
                    )
                  : [];

                return [...a, ...ret];
              }, []);

        // console.log("userID", userID, role, usersSelected);

        socket.emit(
          "action",
          payloadProjects({
            projects: await Promise.all(
              projectsList
                .filter(
                  filterProjectsByUser({
                    role,
                    userID,
                    userList: usersSelected
                  })
                )
                .map(([study, project]) => ({
                  ...project,
                  ...study
                }))
            ),
            projectsListDefault: await queryProjectsListDefault(adapter)
          })
        );
      })
    );

    setTimeout(intervalFunc, intervalSeconds * 1000);
  };

  intervalFunc();
};
