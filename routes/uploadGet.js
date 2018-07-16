import authMiddleware from "../auth/middleware";
import { adapter } from "../server";

export default ({ server, app }) => {
  const { file: { get: fileGet = () => {} } = {} } = adapter;

  server.get("/uploadGet", authMiddleware(), async (req, res) => {
    // TODO Should authMiddleware deal with studyUID checking?
    const { query: { id: studyUID, name } = {} } = req;

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${name}"`
    );

    const path = `${studyUID}/${name}`;

    const stream = await fileGet({ path });
    if (stream) {
      stream.pipe(res);
    }
  });
};
