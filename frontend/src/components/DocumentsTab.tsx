import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Paper,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments';
import { documentsApi } from '../services/api';
import type { DocumentType } from '../types';

interface DocumentsTabProps {
  vehicleId: number;
}

export default function DocumentsTab({ vehicleId }: DocumentsTabProps) {
  const { data: documents, isLoading, error } = useDocuments(vehicleId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('bol');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      uploadMutation.mutate({ vehicleId, formData });
      setFile(null);
    }
  };

  const handleDelete = (documentId: number) => {
    deleteMutation.mutate(documentId);
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
        const response = await documentsApi.download(documentId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Download failed:', error);
    }
  };


  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{(error as Error).message}</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Upload New Document</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              label="Document Type"
            >
              <MenuItem value="bol">Bill of Lading</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="customs_assessment">Customs Assessment</MenuItem>
              <MenuItem value="duty_receipt">Duty Receipt</MenuItem>
              <MenuItem value="delivery_order">Delivery Order</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" component="label">
            Choose File
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {file && <Typography>{file.name}</Typography>}
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            startIcon={<UploadIcon />}
            variant="contained"
          >
            {uploadMutation.isPending ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </Box>
        {uploadMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(uploadMutation.error as Error).message}
          </Alert>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
      {documents && documents.length > 0 ? (
        <List>
          {documents.map((doc) => (
            <ListItem
              key={doc.id}
              secondaryAction={
                <Box>
                  <IconButton href={documentsApi.getPreviewUrl(doc.id)} target="_blank" rel="noopener noreferrer">
                    <PreviewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDownload(doc.id, doc.file_name)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(doc.id)} disabled={deleteMutation.isPending}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary={doc.file_name}
                secondary={`Type: ${doc.document_type} | Version: ${doc.version} | Size: ${(doc.file_size_bytes / 1024).toFixed(2)} KB`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">No documents uploaded yet.</Typography>
      )}
    </Box>
  );
}
