import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "@/App.jsx";
import "@/index.css";
// Import API mock layer for testing interface
import "@/utils/apiMock.js";

// Suppress react-beautiful-dnd defaultProps warnings for testing interface
const originalConsoleError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Support for defaultProps will be removed from memo components')) {
    return; // Suppress this specific warning
  }
  originalConsoleError.apply(console, args);
};
const isDev = process.env.NODE_ENV !== "production";
const REACTWRAP = isDev ? React.Fragment : React.StrictMode;

ReactDOM.createRoot(document.getElementById("root")).render(
  <REACTWRAP>
    <Router>
      <App />
    </Router>
  </REACTWRAP>
);
