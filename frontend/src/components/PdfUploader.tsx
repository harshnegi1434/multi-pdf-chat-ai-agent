import React, { useState } from "react";
import { Button, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText, Chip } from "@mui/material";
import { CloudUpload, Description, CheckCircle } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import axios from "axios";

interface FileInfo {
  name: string;
  size: number;
  pages?: number;
}

interface PdfUploaderProps {
  onSuccess: (files: FileInfo[]) => void;
  dark?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PdfUploader: React.FC<PdfUploaderProps> = ({ onSuccess, dark }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const getPdfPageCount = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      console.error("Error reading PDF:", error);
      // Fallback to estimation if PDF parsing fails
      return Math.max(1, Math.round(file.size / 51200));
    }
  };

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
    
    try {
      // First, get the actual page counts for all PDFs
      const fileInfosWithPages = await Promise.all(
        files.map(async (file) => {
          const pageCount = await getPdfPageCount(file);
          return {
            name: file.name,
            size: file.size,
            pages: pageCount
          };
        })
      );

      // Then upload the files
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      await axios.post(`${API_URL}/upload_pdfs`, formData);
      
      // Pass the file info with actual page counts
      onSuccess(fileInfosWithPages);
    } catch (error: any) {
      alert("Upload failed! " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Upload Documents
        </Typography>
        <Chip 
          label="PDF Only" 
          size="small" 
          variant="outlined"
          sx={{ borderRadius: 1 }}
        />
      </Box>

      <motion.div
        animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            border: files.length || isDragActive 
              ? "2px solid" 
              : "2px dashed",
            borderColor: files.length || isDragActive 
              ? "primary.main" 
              : "grey.300",
            textAlign: "center",
            background: isDragActive 
              ? (dark ? "rgba(129, 140, 248, 0.05)" : "rgba(99, 102, 241, 0.02)")
              : "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.light",
              background: dark ? "rgba(129, 140, 248, 0.03)" : "rgba(99, 102, 241, 0.01)",
            },
          }}
          elevation={0}
        >
          <input {...getInputProps()} />
          <Box sx={{ py: 2 }}>
            <CloudUpload 
              sx={{ 
                fontSize: 48, 
                color: "primary.main", 
                mb: 2,
                opacity: 0.8 
              }} 
            />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
              {isDragActive
                ? "Drop your files here"
                : "Drag & drop PDF files"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse your files
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {files.length === 1 
                ? "1 PDF selected" 
                : `${files.length} PDFs selected`
              }
            </Typography>
            <List sx={{ p: 0 }}>
              {files.map((file, idx) => (
                <ListItem 
                  key={idx} 
                  sx={{ 
                    px: 0, 
                    py: 1,
                    borderBottom: idx < files.length - 1 ? 1 : 0,
                    borderColor: "divider",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Description color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                    primaryTypographyProps={{ 
                      fontSize: 14, 
                      fontWeight: 500 
                    }}
                    secondaryTypographyProps={{ 
                      fontSize: 12
                    }}
                  />
                  <CheckCircle 
                    sx={{ 
                      color: "success.main", 
                      fontSize: 20,
                      opacity: 0.7 
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </motion.div>
      )}

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || !files.length}
          fullWidth
          size="large"
          startIcon={loading ? undefined : <CloudUpload />}
          sx={{ 
            py: 1.5,
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {loading 
            ? "Reading PDFs & Uploading..." 
            : files.length === 1 
              ? "Upload" 
              : files.length > 1 
                ? "Upload All" 
                : "Upload"
          }
        </Button>
      </Box>
    </Box>
  );
};

export default PdfUploader;