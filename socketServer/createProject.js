import createProject from "../helpers/createProject";
import { route, fetchAction } from "../actions";
import { adapter } from "../server";

const defaultStatus = "Pending";

export default async ({
  socket,
  action: { studyUID, defaultStudyUID = "" } = {}
}) => {
  const {
    projects: {
      setProject = () => {},
      setProjectSnapshot = () => {},
      getProjectSnapshot = () => {}
    } = {}
  } = adapter;

  if (!studyUID) {
    return;
  }

  // TODO check if the project already exists if so just load
  console.log("Creating new project", studyUID, defaultStudyUID);

  await socket.emit("action", fetchAction(true));

  // TODO Add better error handling
  const project =
    defaultStudyUID !== ""
      ? await getProjectSnapshot({ studyUID: defaultStudyUID })
      : createProject({ studyUID });

  await setProject({
    studyUID,
    props: { defaultStudyUID, status: defaultStatus }
  });
  await setProjectSnapshot({ studyUID, payload: project });

  await socket.emit(
    "action",
    route({ pathname: "/projectDetail", query: { studyUID } })
  );

  socket.emit("action", fetchAction(false));
};
