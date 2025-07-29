import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import LyricsPage from './pages/LyricsPage';
import StatsPage from './pages/StatsPage';
import RecentPage from './pages/RecentPage';
import { usePlayerStore } from './stores';

function App() {
  const { checkLoginStatus } = usePlayerStore();

  // 应用启动时检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="/lyrics" element={<LyricsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/recent" element={<RecentPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;