import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Button } from "reactstrap";
import { MdEdit as EditIcon, MdDelete as DeleteIcon } from "react-icons/md";
import Wrapper from "../hoc/wrapper";
import * as actions from "../actions";
import MediaCardIdentity from "../components/MediaCardIdentity";
import MediaCardHeader from "../components/MediaCardHeader";
import MediaCardContent from "../components/MediaCardContent";
import ActionGroup from "../components/ActionGroup";
import IconButton from "../components/IconButton";
import MediaCardGroup from "../components/MediaCardGroup";
import MediaCard from "../components/MediaCard";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import DropDownButton from "../components/DropDownButton";
import ManageTeamModal from "../components/ManageTeamModal";
import _ from "underscore"; // TODO use ramda instead. WG
import TeamButton, { TEAM_ACTION_OPTIONS } from "../components/TeamButton";

class Users extends Component {
  static async getInitialProps({
    store,
    isServer,
    query: { users = [], teams = [] }
  }) {
    const { payloadUsers, payloadTeams } = actions;

    if (isServer) {
      //TODO Should we wrap these in a single action?
      store.dispatch(payloadUsers({ data: users }));
      store.dispatch(payloadTeams(teams));
      return;
    }

    store.dispatch({ type: "server/pageUsers" });
  }

  constructor(props) {
    super(props);
    this.state = {
      currentUser: {},
      createUserModal: false,
      editUserModal: false,
      deleteUserModal: false,
      manageTeamModal: false
    };
  }

  toggleCreateUserModal = () => {
    const { createUserModal } = this.state;
    this.setState({
      createUserModal: !createUserModal
    });
  };

  toggleManageTeamModal = () => {
    const { manageTeamModal } = this.state;
    this.setState({
      manageTeamModal: !manageTeamModal
    });
  };

  toggleEditUserModal = user => {
    const { editUserModal, currentUser } = this.state;
    this.setState({
      currentUser: editUserModal ? currentUser : user,
      editUserModal: !editUserModal
    });
  };

  onDeleteClick = user => {
    const { deleteUserModal, currentUser } = this.state;
    this.setState({
      currentUser: deleteUserModal ? currentUser : user,
      deleteUserModal: !deleteUserModal
    });
    // this.props.deleteUser(value);
  };

  onRoleUpdated = (user, item) => {
    user.role = item;
    this.props.editUser(user);
  };

  isRelated = (user, loggedInUser) => {
    if (loggedInUser.role === "admin") return true;
    else if (user.role === "admin") return false;
    const currentUserAllTeamId = user.teams && user.teams.map(team => team.id);
    const loginUserAllTeamId =
      loggedInUser.teams && loggedInUser.teams.map(team => team.id);
    const found = _.intersection(currentUserAllTeamId, loginUserAllTeamId)
      .length
      ? true
      : false;
    return found;
  };

  updateUserTeam = (user, option, team) => {
    switch (option) {
      case TEAM_ACTION_OPTIONS.REMOVE_FROM_TEAM:
        user.teams.isTeamAdmin = false;
        user.teams = user.teams.filter(_team => _team.id !== team.id);
        this.props.editUser(user);
        break;
      case TEAM_ACTION_OPTIONS.ASSIGN_TEAM_ADMIN:
        user.teams
          .filter(_team => _team.id === team.id)
          .map(_team => (_team.isTeamAdmin = true));
        this.props.editUser(user);
        break;
      case TEAM_ACTION_OPTIONS.REMOVE_TEAM_ADMIN:
        user.teams
          .filter(_team => _team.id === team.id)
          .map(_team => (_team.isTeamAdmin = false));
        this.props.editUser(user);
        break;
      default:
        break;
    }
  };

  render() {
    const {
      deleteUser,
      createUser,
      createTeam,
      editUser,
      user: loggedInUser,
      userList: { data, fetching },
      teamList: teams
    } = this.props;

    return (
      <div className="root">
        <style jsx>{`
          .root {
            background: #eceeef;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
        `}</style>
        <MediaCardHeader>
          <MediaCardIdentity>Name</MediaCardIdentity>
          <MediaCardContent>Email/User Name</MediaCardContent>
          {loggedInUser.role === "admin" && (
            <MediaCardContent>Role</MediaCardContent>
          )}
          <MediaCardContent>Team</MediaCardContent>
          <ActionGroup shown={loggedInUser.role === "admin"}>
            <Button
              onClick={this.toggleManageTeamModal}
              color="primary"
              size="sm"
            >
              Manage Teams
            </Button>
          </ActionGroup>
          <ActionGroup
            shown={
              loggedInUser.role === "admin" ||
              loggedInUser.teams.filter(user => user.isTeamAdmin === true)
                .length
            }
          >
            <Button
              onClick={this.toggleCreateUserModal}
              color="primary"
              size="sm"
            >
              Create User
            </Button>
          </ActionGroup>
        </MediaCardHeader>
        <MediaCardGroup>
          {data.map(
            user =>
              this.isRelated(user, loggedInUser) && (
                <MediaCard key={user.id} self={user.id === loggedInUser.id}>
                  <MediaCardIdentity>{user.name}</MediaCardIdentity>
                  <MediaCardContent>{user.username}</MediaCardContent>
                  {loggedInUser.role === "admin" && (
                    <MediaCardContent>
                      <DropDownButton
                        keyValue={user.id}
                        items={["admin", "user"]}
                        defaultItem={user.role}
                        onItemSelected={item => this.onRoleUpdated(user, item)}
                      />
                    </MediaCardContent>
                  )}
                  <MediaCardContent>
                    {Array.isArray(user.teams) &&
                      user.teams.map((item, index) => (
                        <TeamButton
                          key={"dropdown" + user.id + "item" + index}
                          keyValue={"team" + user.id + "item" + index}
                          currentUser={loggedInUser}
                          team={item}
                          onOptionSelected={(option, team) =>
                            this.updateUserTeam(user, option, team)
                          }
                        />
                      ))}
                  </MediaCardContent>
                  <ActionGroup>
                    <Button color="primary" size="sm">
                      Manage Teams
                    </Button>
                  </ActionGroup>
                  <ActionGroup
                    shown={
                      loggedInUser.role === "admin" ||
                      loggedInUser.teams.filter(
                        user => user.isTeamAdmin === true
                      ).length ||
                      user.id === loggedInUser.id
                    }
                  >
                    <IconButton onClick={() => this.toggleEditUserModal(user)}>
                      <EditIcon size="25px" />
                    </IconButton>
                    <IconButton onClick={() => this.onDeleteClick(user)}>
                      <DeleteIcon size="25px" />
                    </IconButton>
                  </ActionGroup>
                </MediaCard>
              )
          )}
        </MediaCardGroup>
        <CreateUserModal
          onSubmit={createUser}
          teams={teams}
          loginUser={loggedInUser}
          isOpen={this.state.createUserModal}
          toggle={this.toggleCreateUserModal}
        />
        <ManageTeamModal
          onSubmit={createTeam}
          teams={teams}
          isOpen={this.state.manageTeamModal}
          toggle={this.toggleManageTeamModal}
        />
        <EditUserModal
          user={this.state.currentUser}
          teams={teams}
          loginUser={loggedInUser}
          onSubmit={editUser}
          isOpen={this.state.editUserModal}
          toggle={this.toggleEditUserModal}
        />
        <DeleteUserModal
          user={this.state.currentUser}
          onSubmit={deleteUser}
          isOpen={this.state.deleteUserModal}
          toggle={this.onDeleteClick}
        />
      </div>
    );
  }
}

const mapStateToProps = ({ user, userList, teamList }) => ({
  user,
  userList,
  teamList
});

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Wrapper(Users));
