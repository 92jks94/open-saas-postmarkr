import * as z from 'zod';
import { type File } from 'wasp/entities';
import { type CreateFile, type DeleteFile, type GetAllFilesByUser, type GetDownloadFileSignedURL } from 'wasp/server/operations';
declare const createFileInputSchema: z.ZodObject<{
    fileType: z.ZodEnum<["application/pdf"]>;
    fileName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileType: "application/pdf";
    fileName: string;
}, {
    fileType: "application/pdf";
    fileName: string;
}>;
type CreateFileInput = z.infer<typeof createFileInputSchema>;
export declare const createFile: CreateFile<CreateFileInput, {
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
}>;
export declare const getAllFilesByUser: GetAllFilesByUser<void, File[]>;
declare const getDownloadFileSignedURLInputSchema: z.ZodObject<{
    key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    key: string;
}, {
    key: string;
}>;
type GetDownloadFileSignedURLInput = z.infer<typeof getDownloadFileSignedURLInputSchema>;
export declare const getDownloadFileSignedURL: GetDownloadFileSignedURL<GetDownloadFileSignedURLInput, string>;
declare const deleteFileInputSchema: z.ZodObject<{
    fileId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileId: string;
}, {
    fileId: string;
}>;
type DeleteFileInput = z.infer<typeof deleteFileInputSchema>;
export declare const deleteFile: DeleteFile<DeleteFileInput, File>;
export declare const processPDFMetadata: (args: {
    fileId: string;
}, context: any) => Promise<void>;
export {};
