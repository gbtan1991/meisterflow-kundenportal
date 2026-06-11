import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { HardDrive, Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DriveUploadButton
 * Props:
 *  - getPdfBase64: async function that returns { base64: string, fileName: string }
 *  - label: optional button label
 *  - folderName: optional subfolder name (default: 'MeisterFlow')
 */
export default function DriveUploadButton({ getPdfBase64, label = 'In Drive speichern', folderName = 'MeisterFlow' }) {
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [driveLink, setDriveLink] = useState(null);

  const handleUpload = async () => {
    setLoading(true);
    try {
      const { base64, fileName } = await getPdfBase64();
      const res = await base44.functions.invoke('uploadPdfToDrive', {
        pdfBase64: base64,
        fileName,
        folderName,
      });
      if (res.data?.success) {
        setUploaded(true);
        setDriveLink(res.data.webViewLink);
        toast.success('PDF in Google Drive gespeichert!');
      } else {
        throw new Error(res.data?.error || 'Unbekannter Fehler');
      }
    } catch (err) {
      if (err.message?.includes('not connected') || err.message?.includes('No connection')) {
        toast.error('Bitte zuerst Google Drive verbinden (in den Einstellungen).');
      } else {
        toast.error('Fehler beim Speichern in Drive: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (uploaded && driveLink) {
    return (
      <Button variant="outline" size="sm" asChild className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
        <a href={driveLink} target="_blank" rel="noopener noreferrer">
          <Check className="w-3.5 h-3.5" />
          In Drive anzeigen
          <ExternalLink className="w-3 h-3" />
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUpload}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <HardDrive className="w-3.5 h-3.5" />
      )}
      {label}
    </Button>
  );
}