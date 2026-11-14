/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router";
import { AppProvider } from "./context/AppContext";
import Layout from "./Layout";
import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import FilesScreen from "./screens/FilesScreen";
import MediaScreen from "./screens/MediaScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/files" element={<FilesScreen />} />
            <Route path="/media" element={<MediaScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

