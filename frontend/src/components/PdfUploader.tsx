import React, { useState } from "react";
import { Button, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import axios from "axios";

interface PdfUploaderProps {
  onSuccess: () => void;
  dark?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const PdfUploader: React.FC<PdfUploaderProps> = ({ onSuccess, dark }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: loading,
  });

  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      await axios.post(`${API_URL}/upload_pdfs`, formData);
      onSuccess();
    } catch (error: any) {
      alert("Upload failed! " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Upload PDF
      </Typography>
      <motion.div
        initial={{ scale: 1, boxShadow: "none" }}
        animate={isDragActive ? { scale: 1.05, boxShadow: "0 0 24px #42a5f5" } : { scale: 1, boxShadow: "none" }}
        transition={{ duration: 0.2 }}
      >
        <Paper
          {...getRootProps()}
          sx={{
            p: 2,
            border: files.length || isDragActive ? "2px solid #42a5f5" : "2px dashed #bdbdbd",
            textAlign: "center",
            bgcolor: dark ? "#222" : "#f8fafc",
            mb: 2,
            borderRadius: 4,
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          elevation={0}
        >
          <input {...getInputProps()} />
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <UploadFileOutlinedIcon sx={{ color: "#42a5f5", fontSize: 38, mb: 1 }} />
            <Typography variant="body1" sx={{ color: "#757575", fontWeight: 500 }}>
              {isDragActive
                ? "Drop PDF files here..."
                : "Drag and drop or select PDF files"}
            </Typography>
          </Box>
          {!!files.length && (
            <List dense sx={{ mt: 1 }}>
              {files.map((file, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <DescriptionIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ fontSize: 12, color: "#888" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </motion.div>
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={loading || !files.length}
        fullWidth
        size="large"
        sx={{ borderRadius: 2, py: 1.2, textTransform: "none" }}
      >
        {loading ? "Uploading..." : "Upload & Start Chat"}
      </Button>
    </Box>
  );
};

export default PdfUploader;