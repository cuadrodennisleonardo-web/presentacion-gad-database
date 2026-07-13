import React, { useRef } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export interface ExportColumn {
  header: string;
  key: string;
}

interface DataExportImportProps {
  data: any[];
  columns: ExportColumn[];
  title: string;
  onImport?: (importedData: any[]) => void;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({ data, columns, title, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Format data for CSV
    const csvData = data.map(row => {
      const formattedRow: any = { Barangay: row.barangay_name };
      columns.forEach(col => {
        formattedRow[col.header] = row[col.key] || 0;
      });
      return formattedRow;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF('landscape');
    doc.text(title, 14, 15);
    const headRow = ['Barangay'];
    const pdfCols: { header: string, keys: string[] }[] = [];
    
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      pdfCols.push({ header: col.header, keys: [col.key] });
      
      const isM = col.header.endsWith('(M)') || col.header.endsWith('(M-Led)');
      if (isM && i + 1 < columns.length) {
        const nextCol = columns[i+1];
        const isF = nextCol.header.endsWith('(F)') || nextCol.header.endsWith('(F-Led)');
        
        const baseNameM = col.header.replace(/\s*\(M(-Led)?\)$/, '');
        const baseNameF = nextCol.header.replace(/\s*\(F(-Led)?\)$/, '');
        
        if (isF && baseNameM === baseNameF) {
          pdfCols.push({ header: nextCol.header, keys: [nextCol.key] });
          pdfCols.push({ header: `${baseNameM} (Total)`, keys: [col.key, nextCol.key] });
          i++; // Skip the next column since we just processed it
        }
      }
    }
    
    pdfCols.forEach(c => headRow.push(c.header));
    
    const tableData = data.map(row => {
      const rowData: any[] = [row.barangay_name];
      pdfCols.forEach(colInfo => {
        let sum = 0;
        colInfo.keys.forEach(k => {
          sum += parseInt(row[k]) || 0;
        });
        rowData.push(sum);
      });
      return rowData;
    });

    autoTable(doc, {
      head: [headRow],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 116, 144] } // brand color cyan-700
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF exported successfully");
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const importedData = results.data.map((row: any) => {
             if (row['Barangay'] === undefined) throw new Error("Missing Barangay column");
             
             const parsedRow: any = { barangay_name: row['Barangay'] || '' };
             columns.forEach(col => {
               parsedRow[col.key] = parseInt(row[col.header]) || 0;
             });
             
             return parsedRow;
          });
          
          if (importedData.length === 0) {
             throw new Error("No data found in CSV");
          }
          
          if (onImport) onImport(importedData);
          toast.success("Data imported successfully. Don't forget to save!");
        } catch (error: any) {
          toast.error("Error parsing CSV. Please ensure you use the exact format from the Export file.");
        }
      },
      error: () => {
        toast.error("Failed to read CSV file.");
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition shadow-xs whitespace-nowrap"
        title="Export as CSV"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button 
        onClick={handleExportPDF}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition shadow-xs whitespace-nowrap"
        title="Export as PDF"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        <span className="hidden sm:inline">PDF</span>
      </button>
      {onImport && (
        <>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 rounded-lg border border-brand-500 bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-2 text-sm font-medium transition dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 shadow-xs whitespace-nowrap"
            title="Import from CSV"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
        </>
      )}
    </div>
  );
};
