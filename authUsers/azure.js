import azure from "azure-storage";
import bcrypt from "bcryptjs";
import queryTable from "../helpers/azure/queryTable";
import mapStringifyJSON from "../helpers/mapStringifyJSON";
import mapParseJSON from "../helpers/mapParseJSON";

// Using reusable table service
import { tableService } from "../projects/adapterAzure/";

const tableName = "users";

/**
 * validates/invalidates the username/password auth from azure
 * @param {*} username
 * @param {*} password
 */
export const getUser = async ({ username = "", password }) => {
  // Always handle and store as lower case
  const query = new azure.TableQuery().where(
    "username eq ?",
    username.toLowerCase()
  );
  const {
    0: { password: passwordCheck, ...user } = {}
  } = await queryTable({ tableService, query, tableName });

  // check if the query corresponding entry has been found or not
  if (passwordCheck) {
    const res = await bcrypt.compare(password, passwordCheck);
    return res === true ? user : false;
  }
  return false;
};

export const getClientInfo = async ({ clientID = 0 }) => {
  const query = new azure.TableQuery().where("id eq ?", clientID);
  const {
    0: {
      name = "",
      address = "",
      city = "",
      state = "",
      country = "",
      zip = ""
    } = {}
  } = await queryTable({ tableService, query, tableName });

  return { name, address, city, state, country, zip };
};

export const setUserProps = async (id = 0, props = {}) => {
  const updatedTask = {
    PartitionKey: id,
    RowKey: id,
    ...mapStringifyJSON(props)
  };

  // TODO Reusable should move to helper area?
  await new Promise((resolve, reject) => {
    tableService.mergeEntity(
      tableName,
      updatedTask,
      (error, result, response) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
  });
};

export const getUserProps = async (id = 0, props = []) => {
  const query = new azure.TableQuery()
    .select(props)
    .where("id eq ?", parseInt(id));
  const [user] = await queryTable({
    tableService,
    query,
    tableName
  });

  return mapParseJSON(user);
};

// TODO should only be for admins?
// Maybe create a more reusable function such as getUserList
export const getClients = async () =>
  await queryTable({
    tableService,
    query: new azure.TableQuery().where("client eq ?", true),
    tableName
  });
