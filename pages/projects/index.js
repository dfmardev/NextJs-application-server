import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions";
import Wrapper from "../../hoc/wrapper";
import ProjectTableList from "../../components/ProjectTableList";
import DefaultProjectModal from "../../components/DefaultProjectModal";
import RichTextEditorModal from "../../components/RichTextEditorModal";

import fieldEnhancer from "./fieldEnhancer";
import header from "./header";
import sortFunc from "./sortFunc";
import filterRender from "./filterRender";
import filterFunc from "./filterFunc";

class ProjectsListing extends Component {
  static async getInitialProps({
    store,
    isServer,
    query: {
      users = [],
      projects,
      renders = [],
      projectsListDefault,
      projectsSettings = {}
    } = {}
  }) {
    const {
      payloadProjects,
      payloadUsers,
      payloadRenders,
      payloadProjectsSettings
    } = actions;

    if (isServer) {
      // TODO Should we wrap these in single action?

      store.dispatch(payloadUsers({ data: users }));
      store.dispatch(payloadProjectsSettings(projectsSettings));
      store.dispatch(payloadProjects({ projects, projectsListDefault }));
      store.dispatch(payloadRenders(renders));

      return;
    }

    store.dispatch({
      type: "server/pageProjects"
    });
    store.dispatch({ type: "server/getSessions" });
  }

  // TODO Remove handle using redux portalSettings or portal?
  constructor(props) {
    super(props);

    // TODO Move to redux?
    this.state = {
      //   popupTarget: null,
      //   popupStudyUID: "",

      modalCreateProjects: false,
      selectedStudyUID: null,
      selectedStudyType: null
    };
  }

  // TODO Move to redux action?
  //   popupOpen = ({ target, studyUID }) => {
  //     this.setState({
  //       popupTarget: target,
  //       popupStudyUID: studyUID
  //     });
  //   };

  //   // TODO Move to redux action?
  //   popupToggle() {
  //     this.setState({
  //       popupTarget: null
  //     });
  //   }

  render() {
    const {
      props,
      props: {
        projects = [],
        projectsListDefault = [],
        sortKey,
        sortDesc,
        projectsListSortKey,
        projectsListSortDesc,
        user: { role } = {},
        setProjectsSettings = () => {},
        uploadDel = () => {},
        createProject = () => {},
        setNotesEditor = () => {},
        richText = () => {}
      } = {},
      state: {
        modalRichText = false,
        modalCreateProjects = false,
        selectedStudyType = null,
        selectedStudyUID = null,
        notes = ""
      }
    } = this;

    const selectedProject =
      projects.find(({ studyUID }) => selectedStudyUID === studyUID) || {};
    const {
      patientID = "",
      patientName = "",
      notes: selectedNotes = ""
    } = selectedProject;
    const projectsEnhanced = fieldEnhancer({
      ...props,
      onCreate: ({ studyUID, studyType }) => {
        // TODO Don't like this.  Could cause side effects? WG
        this.setState({
          modalCreateProjects: true,
          selectedStudyUID: studyUID,
          selectedStudyType: studyType
        });
      },
      onRichText: ({ studyUID, notes }) => {
        this.setState({
          modalRichText: true,
          selectedStudyUID: studyUID,
          notes
        });
      },
      onFileDelete: props => {
        uploadDel(props);
      }
    });

    //   overflow: auto;

    return (
      <div className="projects">
        <style jsx>
          {`
            .projects {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
          `}
        </style>
        <ProjectTableList
          data={projectsEnhanced}
          sortFunc={sortFunc()}
          sortKey={sortKey}
          sortDesc={sortDesc}
          header={header({ admin: role === "admin" })}
          filterFunc={filterFunc(props)}
          filterRender={filterRender(props)}
          onSort={k => setProjectsSettings({ sortKey: k })}
        />

        <RichTextEditorModal
          toggle={() => {
            this.setState({
              modalRichText: !modalRichText
            });
          }}
          setProjectProps={() => {
            richText({
              studyUID: selectedStudyUID,
              defaultStudyUID: ""
            });

            this.setState({
              modalRichText: false
            });
          }}
          isOpen={modalRichText}
          studyUID={selectedStudyUID}
          notes={notes}
        />

        <DefaultProjectModal
          studyType={selectedStudyType}
          studyUID={selectedStudyUID}
          patientID={patientID}
          patientName={patientName}
          sortKey={projectsListSortKey}
          sortDesc={projectsListSortDesc}
          notes={selectedNotes}
          onSort={k => setProjectsSettings({ projectsListSortKey: k })}
          projects={projectsListDefault}
          onToggle={() => {
            this.setState({
              modalCreateProjects: !modalCreateProjects
            });
          }}
          onDefault={() => {
            createProject({
              studyUID: selectedStudyUID,
              defaultStudyUID: ""
            });

            this.setState({
              modalCreateProjects: false
            });
          }}
          isOpen={modalCreateProjects}
          setNotesEditor={() => {
            setNotesEditor({
              studyUID: selectedStudyUID,
              notes: selectedNotes,
              isOpen: true,
              header: `${patientName} (${patientID})`
            });
          }}
          onRowClick={({ studyUID: defaultStudyUID }) => {
            createProject({
              studyUID: selectedStudyUID,
              defaultStudyUID
            });
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = ({
  projectsSettings: {
    // TODO Makebe use a container for settings instead of pass through props?
    sortKey,
    sortDesc,
    filter,
    projectsListSortKey,
    projectsListSortDesc
  },
  projectsListDefault,
  defaultList,
  projects: { projects },
  user,
  renders,
  sessions,
  userList: { data: userList = [] }
}) => ({
  projects,
  projectsListDefault,
  sortKey,
  sortDesc,
  filter,
  projectsListSortKey,
  projectsListSortDesc,
  defaultList,
  user,
  renders,
  sessions,
  userList
});

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Wrapper(ProjectsListing));
