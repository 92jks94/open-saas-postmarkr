import React from 'react';
interface FileSelectorProps {
    selectedFileId: string | null;
    onFileSelect: (fileId: string | null) => void;
    mailType: string;
    mailSize: string;
    className?: string;
}
declare const FileSelector: React.FC<FileSelectorProps>;
export default FileSelector;
//# sourceMappingURL=FileSelector.d.ts.map