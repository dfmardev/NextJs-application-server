import React from "react";

const ArrowIcon = props => {
  const style = {
    fill: props.color,
    width: props.size + "px",
    height: props.size + "px",
    ...props.style
  };
  return (
    <svg
      style={style}
      className={props.className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
};

export default ArrowIcon;
