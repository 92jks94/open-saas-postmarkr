import React from 'react';
interface MailCreationFormProps {
    onSuccess?: (mailPieceId: string) => void;
    className?: string;
}
declare const MailCreationForm: React.FC<MailCreationFormProps>;
export default MailCreationForm;
