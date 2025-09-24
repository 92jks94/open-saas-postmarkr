import React from 'react';
/**
 * Props for the FileSelector component
 */
interface FileSelectorProps {
    /** Currently selected file ID */
    selectedFileId: string | null;
    /** Callback when file selection changes */
    onFileSelect: (fileId: string | null) => void;
    /** Type of mail piece (affects file requirements) */
    mailType: string;
    /** Size of mail piece (affects file dimensions) */
    mailSize: string;
    /** Optional CSS classes for styling */
    className?: string;
}
declare const _default: React.NamedExoticComponent<FileSelectorProps>;
export default _default;
//# sourceMappingURL=FileSelector.d.ts.map