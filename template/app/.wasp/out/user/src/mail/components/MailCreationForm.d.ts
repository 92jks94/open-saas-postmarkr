import React from 'react';
/**
 * Props for the MailCreationForm component
 */
interface MailCreationFormProps {
    /** Callback fired when mail piece is successfully created and paid */
    onSuccess?: (mailPieceId: string) => void;
    /** Optional CSS classes for styling */
    className?: string;
}
declare const MailCreationForm: React.FC<MailCreationFormProps>;
export default MailCreationForm;
