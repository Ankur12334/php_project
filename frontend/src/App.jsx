import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import LoginPage from './pages/LoginPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import PostListingPage from './pages/owner/PostListingPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import BookingHistoryPage from './pages/customer/BookingHistoryPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute roles={['user']}>
              <main className="px-4 py-6 sm:px-6 lg:px-8">
                <OwnerDashboardPage />
              </main>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/post-listing"
          element={(
            <ProtectedRoute roles={['user']}>
              <main className="px-4 py-6 sm:px-6 lg:px-8">
                <PostListingPage />
              </main>
            </ProtectedRoute>
          )}
        />
        <Route path="/owner" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute roles={['admin']}>
              <main className="px-4 py-6 sm:px-6 lg:px-8">
                <AdminDashboardPage />
              </main>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/bookings"
          element={(
            <ProtectedRoute roles={['user']}>
              <main className="px-4 py-6 sm:px-6 lg:px-8">
                <BookingHistoryPage />
              </main>
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
