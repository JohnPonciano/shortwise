
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCodeGenerator from '@/components/LinkFeatures/QRCodeGenerator';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  linkTitle?: string;
}

export function QRCodeDialog({ isOpen, onClose, shortUrl, linkTitle }: QRCodeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code do Link</DialogTitle>
        </DialogHeader>
        <QRCodeGenerator shortUrl={shortUrl} linkTitle={linkTitle} />
      </DialogContent>
    </Dialog>
  );
}
