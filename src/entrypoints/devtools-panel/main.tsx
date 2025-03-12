import React from "react";
import ReactDOM from "react-dom/client";
import { DevTools } from "./components/DevTools";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DevTools />
  </React.StrictMode>
);
