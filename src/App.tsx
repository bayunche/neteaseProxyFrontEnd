import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;