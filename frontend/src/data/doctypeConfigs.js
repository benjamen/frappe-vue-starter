// src/doctypeConfigs.js
import { faCheck } from "@fortawesome/free-solid-svg-icons";


export const doctypeConfigs = {
  ToDo: {
    title: "Task Manager",
    subtitle: "Stay organized and productive",
    singular: "Task",
    addFields: [
      {
        name: "description",
        label: "Description",
        required: true,
        type: "textarea",
        placeholder: "What needs to be done?",
      },
      {
        name: "status",
        label: "Status",
        required: true,
        type: "select",
        placeholder: "Status",
      },
    ],
    displayFields: [
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select" },
    ],
    nav: {
      name: "Tasks",          // Text shown in nav
      to: "/list/ToDo",       // Link (route) for this doctype page
      icon: faCheck,          // Icon (make sure it's imported)
    },
  },
  // ...other doctypes, each can have their own `nav`
};
