import React, { useState } from "react";
import { CssBaseline, Container, Box, Paper, Stack, ThemeProvider, IconButton, Typography, Button, Chip, Divider, Link } from "@mui/material";
import { Brightness4, Brightness7, Description, Refresh, AttachFile, GitHub, LinkedIn } from "@mui/icons-material";
import PdfUploader from "./components/PdfUploader";
import ChatBox from "./components/ChatBox";
import { lightTheme, darkTheme } from "./theme";

interface FileInfo {
  name: string;
  size: number;
  pages?: number;
}


const App: React.FC = () => {
  const [pdfsUploaded, setPdfsUploaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [sessionId, setSessionId] = useState<string>("");

  const theme = darkMode ? darkTheme : lightTheme;

  const handleUploadSuccess = (result: { files: FileInfo[]; session_id: string }) => {
    setUploadedFiles(result.files);
    setSessionId(result.session_id);
    setPdfsUploaded(true);
  };

  const handleStartAgain = () => {
    setPdfsUploaded(false);
    setUploadedFiles([]);
    setSessionId("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background: darkMode 
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)",
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            mb: 2
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="InsightPDF Logo" 
                  style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "contain"
                  }}
                />
              </Box>
              <Box>
                <Typography variant="h5" component="h1" sx={{ 
                  fontWeight: 800,
                  letterSpacing: -0.5,
                }}>
                  <Box component="span" sx={{
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    Insight
                  </Box>
                  <Box component="span" sx={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    PDF
                  </Box>
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setDarkMode(!darkMode)}
              sx={{ 
                borderRadius: 3,
                padding: 2,
                border: 1,
                borderColor: "divider",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                "&:hover": {
                  transform: "scale(1.05)",
                  transition: "transform 0.2s ease",
                }
              }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>

          {/* Main Content - Centered */}
          <Box 
            sx={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: pdfsUploaded ? "flex-start" : "center",
              textAlign: "center",
              px: 2
            }}
          >
            {!pdfsUploaded ? (
              <>
                {/* Hero Section - Only show when no files uploaded */}
                <Box sx={{ mb: 6, maxWidth: "800px" }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: { xs: "3rem", md: "4.5rem" },
                      fontWeight: 900,
                      mb: 3,
                      letterSpacing: -2,
                      lineHeight: 1.1
                    }}
                  >
                    <Box component="span" sx={{
                      background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      Insight
                    </Box>
                    <Box component="span" sx={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      PDF
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: "text.secondary",
                      fontSize: "1.3rem",
                      maxWidth: "600px",
                      mx: "auto",
                      opacity: 0.8,
                      fontWeight: 400
                    }}
                  >
                    Upload your PDF documents and get intelligent insights through natural conversation.
                  </Typography>
                </Box>

                {/* Upload Section */}
                <Box sx={{ width: "100%", maxWidth: "700px" }}>
                  <Paper 
                    elevation={0}
                    sx={{
                      p: 6,
                      backdropFilter: "blur(20px)",
                      background: darkMode 
                        ? "rgba(30, 41, 59, 0.9)"
                        : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 4,
                      border: 1,
                      borderColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                      boxShadow: darkMode 
                        ? "0 20px 60px rgba(99, 102, 241, 0.1)"
                        : "0 20px 60px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <PdfUploader onSuccess={handleUploadSuccess} dark={darkMode} />
                  </Paper>
                </Box>
              </>
            ) : (
              <>
                {/* File Info Section - Made smaller */}
                <Box sx={{ width: "100%", maxWidth: "800px", mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ 
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      Uploaded Documents
                    </Typography>
                    <Button
                      onClick={handleStartAgain}
                      startIcon={<Refresh />}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "primary.main",
                        "&:hover": {
                          background: "primary.main",
                          color: "white"
                        }
                      }}
                    >
                      Start Again
                    </Button>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backdropFilter: "blur(20px)",
                      background: darkMode 
                        ? "rgba(30, 41, 59, 0.9)"
                        : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 2,
                      border: 1,
                      borderColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                    }}
                  >
                    {uploadedFiles.map((file, index) => (
                      <Box key={index} sx={{ mb: index < uploadedFiles.length - 1 ? 1.5 : 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                          <AttachFile sx={{ color: "primary.main", fontSize: 18 }} />
                          <Typography variant="body1" fontWeight={600} sx={{ flex: 1, fontSize: "0.95rem" }}>
                            {file.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, ml: 3 }}>
                          <Chip 
                            label={formatFileSize(file.size)} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                          />
                          <Chip 
                            label={file.pages ? `${file.pages} pages` : "Processing..."} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                          />
                        </Box>
                        {index < uploadedFiles.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                      </Box>
                    ))}
                  </Paper>
                </Box>

                {/* Chat Section - Made bigger */}
                <Box sx={{ width: "100%", maxWidth: "800px", flex: 1, minHeight: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: "calc(100vh - 280px)",
                      backdropFilter: "blur(20px)",
                      background: darkMode 
                        ? "rgba(30, 41, 59, 0.9)"
                        : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 4,
                      border: 1,
                      borderColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                      boxShadow: darkMode 
                        ? "0 20px 60px rgba(99, 102, 241, 0.1)"
                        : "0 20px 60px rgba(0, 0, 0, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <ChatBox dark={darkMode} sessionId={sessionId} />
                  </Paper>
                </Box>
              </>
            )}
          </Box>

          {/* Footer Credits */}
          <Box sx={{ 
            mt: 3, 
            textAlign: "center", 
            py: 2,
            borderTop: 1,
            borderColor: "divider",
            opacity: 0.8
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Created by <strong>Harsh Negi</strong>
            </Typography>
            <Stack 
              direction="row" 
              spacing={3} 
              justifyContent="center" 
              alignItems="center"
            >
              <Link
                href="https://github.com/harshnegi1434"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  textDecoration: "none",
                  color: "text.secondary",
                  "&:hover": {
                    color: "primary.main",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease"
                }}
              >
                <GitHub sx={{ fontSize: 18 }} />
                <Typography variant="body2">GitHub</Typography>
              </Link>
              
              <Box sx={{ 
                width: 1, 
                height: 20, 
                bgcolor: "divider" 
              }} />
              
              <Link
                href="https://www.linkedin.com/in/harshnegi1434/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  textDecoration: "none",
                  color: "text.secondary",
                  "&:hover": {
                    color: "#0077b5",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease"
                }}
              >
                <LinkedIn sx={{ fontSize: 18 }} />
                <Typography variant="body2">LinkedIn</Typography>
              </Link>
            </Stack>
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;