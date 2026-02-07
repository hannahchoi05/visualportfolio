import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GraphPage from "./pages/graphPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<GraphPage />} />
    </Routes>
  );
}
