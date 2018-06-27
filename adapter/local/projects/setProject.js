import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

export default async ({ studyUID, props = {}, path }) => {
  if (path === undefined || !studyUID) return;

  const db = low(new FileSync(`${path}/projects.json`));
  db.defaults({ projects: [] }).write();

  const find = db
    .get("projects")
    .find({ studyUID })
    .value();

  if (find === undefined) {
    db.get("projects")
      .push({ studyUID, ...props })
      .write();
    return;
  }

  db.get("projects")
    .find({ studyUID })
    .assign(props)
    .write();
};
