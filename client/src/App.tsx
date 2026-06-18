import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Feed } from "@/pages/Feed";
import { Standings } from "@/pages/Standings";
import { Bracket } from "@/pages/Bracket";
import { Team } from "@/pages/Team";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="standings" element={<Standings />} />
        <Route path="bracket" element={<Bracket />} />
        <Route path="team/:id" element={<Team />} />
        <Route path="*" element={<Feed />} />
      </Route>
    </Routes>
  );
}
