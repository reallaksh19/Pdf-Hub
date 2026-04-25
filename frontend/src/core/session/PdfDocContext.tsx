import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PdfDocContextType {
  pdfDoc: PDFDocumentProxy | null;
  setPdfDoc: (doc: PDFDocumentProxy | null) => void;
}

const PdfDocContext = createContext<PdfDocContextType>({
  pdfDoc: null,
  setPdfDoc: () => {},
});

export const PdfDocProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  return (
    <PdfDocContext.Provider value={{ pdfDoc, setPdfDoc }}>
      {children}
    </PdfDocContext.Provider>
  );
};

export const usePdfDoc = () => useContext(PdfDocContext);
