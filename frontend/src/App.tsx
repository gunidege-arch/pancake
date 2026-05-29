import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import PageTransition from "./components/PageTransition";
import SearchPage from "./pages/SearchPage";
import MusicPage from "./pages/MusicPage";
import WallpaperPage from "./pages/WallpaperPage";
import ToastContainer from "./components/Toast";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route element={<PageTransition />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/wallpaper" element={<WallpaperPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}
