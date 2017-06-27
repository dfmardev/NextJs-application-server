import { queryStudies } from '../dicom';
import { queryProjectList } from '../projects';

export default ({ server, app }) =>
    server.get("/projects", async (req, res) => {
        if (req.isAuthenticated()) {
            let studies = await queryStudies();
            // let projects = await queryProjects();

            // const projects = studies.map(v => {
            // });

            return app.render(req, res, "/projects", { ...req.query, projects: studies });
        }

        console.log('/projects not auth');
        return res.redirect('/');
    });