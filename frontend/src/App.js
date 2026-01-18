import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import EditTeam from "./pages/Teams/EditTeam";

import Tournaments from "./pages/Tournaments/Tournaments";
import TournamentDetails from "./pages/Tournaments/TournamentDetails";

import Teams from "./pages/Teams/Teams";
import TeamDetails from "./pages/Teams/TeamDetails";
import CreateTeam from "./pages/Teams/CreateTeam";
import MyTeam from "./pages/Teams/MyTeam";
import About from "./pages/About/About";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import Account from "./pages/Account/Account";
import BackendOffline from "./pages/BackendOffline/BackendOffline";

// ADMIN
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminTournaments from "./pages/Admin/AdminTournaments";
import AdminTeams from "./pages/Admin/AdminTeams"; // ✅ NOWE

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/backend-offline" element={<BackendOffline />} />
        <Route path="/team/edit" element={<EditTeam />} />
        <Route path="/o-nas" element={<About />} />

        {/* TOURNAMENTS */}
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:slug" element={<TournamentDetails />} />

        {/* TEAMS (public) */}
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:slug" element={<TeamDetails />} />

        {/* TEAM (logged-in) */}
        <Route
          path="/team/create"
          element={
            <ProtectedRoute>
              <CreateTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/me"
          element={
            <ProtectedRoute>
              <MyTeam />
            </ProtectedRoute>
          }
        />

        {/* ACCOUNT */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="teams" element={<AdminTeams />} /> {/* ✅ */}
        </Route>
      </Routes>

      <Footer />
    </>
  );
}
