import { SET_PROJECT_PROPS } from "../constants/actionTypes";

export default async ({
  socket,
  action: { studyUID, type, ...props } = {},
  adapter
}) => {
  const {
    projects: { setProject = () => {} } = {},
    renders: { setRenderQueue = () => {} } = {}
  } = adapter;

  const { status } = props;

  if (status === "Done") {
    setRenderQueue({
      studyUID,
      template: "spine"
    });

    setRenderQueue({
      studyUID,
      template: "spineImages"
    });
  }

  await setProject({ studyUID, props });

  // Broadcast updated project props to other connected users
//   socket.broadcast.emit("action", {
//     type: SET_PROJECT_PROPS,
//     studyUID,
//     ...props
//   });
};
