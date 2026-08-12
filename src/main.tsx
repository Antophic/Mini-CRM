import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MiniCrmApp } from "./MiniCrmApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MiniCrmApp />
  </StrictMode>,
);
