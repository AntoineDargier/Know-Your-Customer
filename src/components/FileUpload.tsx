
import { useState } from "react";
import { Upload, X, FileText, File, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const updatedFiles = [...files, ...droppedFiles];
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const updatedFiles = [...files, ...selectedFiles];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="text-green-500" />;
      default:
        return <File className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-1">
          Glissez-déposez vos fichiers ici ou cliquez pour parcourir
        </p>
        <p className="text-xs text-gray-400">
          Formats acceptés: PDF, DOCX, XLSX, etc.
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" /> 
            {files.length} fichier{files.length > 1 ? "s" : ""} téléversé{files.length > 1 ? "s" : ""}
          </div>
          
          <div className="space-y-2 mt-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
