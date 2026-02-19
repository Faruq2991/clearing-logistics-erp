import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useDocumentVersions } from '../hooks/useDocuments';
import { documentsApi } from '../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  documentId: number | null;
}

export default function VersionHistory({ open, onClose, documentId }: Props) {
  if (!documentId) return null;

  const { data: versions, isLoading, error } = useDocumentVersions(documentId);

  const handleDownload = async (docId: number, fileName: string) => {
    try {
        const response = await documentsApi.download(docId);
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

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h6" gutterBottom>Version History</Typography>
        {isLoading && <CircularProgress />}
        {error && <Alert severity="error">{(error as Error).message}</Alert>}
        {versions && (
          <List>
            {versions.map((version) => (
              <ListItem
                key={version.id}
                secondaryAction={
                  <IconButton onClick={() => handleDownload(version.id, version.file_name)}>
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`Version ${version.version}`}
                  secondary={`Uploaded on: ${new Date(version.created_at!).toLocaleDateString()} | Size: ${(version.file_size_bytes / 1024).toFixed(2)} KB`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
}
