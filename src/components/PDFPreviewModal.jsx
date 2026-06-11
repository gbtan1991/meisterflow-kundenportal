import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export default function PDFPreviewModal({ open, onOpenChange, pdfDoc, filename }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (pdfDoc && open) {
      const blob = pdfDoc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfDoc, open]);

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(filename);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between">
          <DialogTitle>{filename}</DialogTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1.5" /> Herunterladen
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}