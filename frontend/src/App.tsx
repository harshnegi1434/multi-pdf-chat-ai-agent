import React, { useState } from "react";
import { CssBaseline, Container, Box, Paper, Stack, useTheme, IconButton } from "@mui/material";
import PdfUploader from "./components/PdfUploader";
import ChatBox from "./components/ChatBox";
import GradientBG from "./components/GradientBG";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const App: React.FC = () => {
  const [pdfsUploaded, setPdfsUploaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // For MUI, you should wrap this in ThemeProvider in index.tsx for real theme switching.
  // Here is a quick toggle for demo.
  React.useEffect(() => {
    document.body.style.background = darkMode
      ? "linear-gradient(135deg,#222,#444 100%)"
      : "linear-gradient(135deg,#f8fafc 0%, #e8eaf6 100%)";
  }, [darkMode]);

  return (
    <>
      <CssBaseline />
      <GradientBG dark={darkMode} />
      <Container maxWidth="sm" sx={{ minHeight: "100vh", zIndex: 1, position: "relative" }}>
        <Stack spacing={4} alignItems="center" sx={{ pt: 8, pb: 4 }}>
          <Box sx={{ textAlign: "center", width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <IconButton onClick={() => setDarkMode((m) => !m)} sx={{ mb: 1 }}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
            <Box sx={{ mb: 2 }}>
              {/* SVG robot logo */}
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                <circle cx="27" cy="27" r="27" fill="#1976d2" opacity="0.1"/>
                <ellipse cx="27" cy="32" rx="15" ry="8" fill="#1976d2" opacity="0.7"/>
                <circle cx="20" cy="27" r="4" fill="#1976d2"/>
                <circle cx="34" cy="27" r="4" fill="#1976d2"/>
                <rect x="23" y="36" width="8" height="3" rx="1.5" fill="#1976d2"/>
              </svg>
            </Box>
            <Box sx={{
              fontWeight: 700,
              fontSize: { xs: 28, sm: 32 },
              letterSpacing: -1,
              color: darkMode ? "#fff" : "#1976d2",
            }}>
              DocuBot: Smart PDF Chat
            </Box>
            <Box sx={{
              color: darkMode ? "#e3f2fd" : "#444",
              mt: 1,
              fontSize: 16,
            }}>
              Upload your PDF and chat with it instantly.
            </Box>
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              width: "100%",
              borderRadius: 6,
              backdropFilter: "blur(8px)",
              bgcolor: darkMode ? "rgba(40,40,60,0.7)" : "rgba(255,255,255,0.7)",
              boxShadow: "0 2px 16px rgba(60,72,88,.08)",
            }}
          >
            <PdfUploader onSuccess={() => setPdfsUploaded(true)} dark={darkMode}/>
          </Paper>
          {pdfsUploaded && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                width: "100%",
                borderRadius: 6,
                mt: 2,
                backdropFilter: "blur(8px)",
                bgcolor: darkMode ? "rgba(40,40,60,0.7)" : "rgba(255,255,255,0.7)",
                boxShadow: "0 2px 16px rgba(60,72,88,.10)",
              }}
            >
              <ChatBox dark={darkMode}/>
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default App;