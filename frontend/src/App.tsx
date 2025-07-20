import React, { useState } from "react";
import { Container, Typography, Box, Paper } from "@mui/material";
import PdfUploader from "./components/PdfUploader";
import ChatBox from "./components/ChatBox";

const App: React.FC = () => {
  const [pdfsUploaded, setPdfsUploaded] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: "center" }}>
        <img src="/robot.png" alt="AI Robot" width={80} style={{ marginBottom: 16 }} />
        <Typography variant="h4" gutterBottom>Multi-PDF Chat Agent 🤖</Typography>
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <PdfUploader onSuccess={() => setPdfsUploaded(true)} />
      </Paper>
      {pdfsUploaded && (
        <Paper sx={{ p: 2 }}>
          <ChatBox />
        </Paper>
      )}
      <Box sx={{
        mt: 4, textAlign: "center", bgcolor: "#0E1117", color: "#fff", py: 2, position: "fixed", left: 0, bottom: 0, width: "100%"
      }}>
        © <a href="https://github.com/gurpreetkaurjethra" style={{ color: "#fff" }}>Gurpreet Kaur Jethra</a> | Made with ❤️
      </Box>
    </Container>
  );
};

export default App;