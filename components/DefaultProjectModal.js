import React from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

import TableList from "./TableList";

const header = () => ({
  name: "Name",
  patientAge: "Age",
  patientSex: "Gender",
  studyType: "Study Type"
});

const filterFunc = ({ studyType: studyTypeFilter }) => ({
  studyType: ({ studyType }) => {
    return studyTypeFilter
      ? new RegExp(studyTypeFilter, "gi").test(studyType)
      : true;
  }
});

// TODO Reused other places place in helpers location
const strSort = (a = "", b = "") => {
  const strA = `${a}`.toUpperCase();
  const strB = `${b}`.toUpperCase();

  if (strA < strB) {
    return -1;
  }

  if (strA > strB) {
    return 1;
  }

  return 0;
};

const sortFunc = () => ({
  name: ({ name: a }, { name: b }) => strSort(a, b),
  patientAge: ({ patientAge: a }, { patientAge: b }) => {
    const testA = parseInt(a);
    const testB = parseInt(b);

    return (isNaN(testA) ? 0 : testA) - (isNaN(testB) ? 0 : testB);
  },
  patientSex: ({ patientSex: a }, { patientSex: b }) => strSort(a, b),
  studyType: ({ studyType: a }, { studyType: b }) => strSort(a, b)
});

export default ({
  base,
  isOpen,
  projects = [],
  sortKey = "",
  sortDesc = false,
  studyType,
  onSort = () => {},
  onDefault = () => {},
  onToggle = () => {},
  onRowClick = () => {}
}) => {
  const projectsEnhanced = projects.map(
    ({ patientBirthDate = new Date(), patientName, defaultName, ...v }) => {
      return {
        ...v,
        patientName,
        defaultName,
        patientAge:
          new Date().getFullYear() - new Date(patientBirthDate).getFullYear(),
        name: defaultName && defaultName !== "" ? defaultName : patientName
      };
    }
  );

  return (
    <Modal style={{ maxWidth: "80%" }} isOpen={isOpen} toggle={onToggle}>
      <style jsx>
        {`
          @media (class: max-width: 80%;) {
            .modal-dialog {
              max-width: 80%;
            }
          }
        `}
      </style>
      <ModalHeader toggle={onToggle}>Create Project</ModalHeader>
      <ModalBody>
        <TableList
          data={projectsEnhanced}
          header={header()}
          sortFunc={sortFunc()}
          filterFunc={filterFunc({ studyType })}
          sortKey={sortKey}
          sortDesc={sortDesc}
          onSort={onSort}
          onRowClick={onRowClick}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          color={base ? "primary" : "secondary"}
          onClick={() => {
            onDefault();
          }}
        >
          Default - Base
        </Button>
        <Button color="secondary" onClick={onToggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};