import { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
};

export function FileDropzone({ onFileSelect, disabled }: FileDropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragActive(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [disabled, onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-dashed border-2 px-6 py-12 transition-colors cursor-pointer",
                isDragActive
                    ? "border-indigo-400 bg-indigo-50/50"
                    : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleChange}
                accept="application/pdf,image/*"
                disabled={disabled}
            />
            <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-zinc-200/50">
                <UploadCloud className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-zinc-900">
                    Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                    PDF, PNG, or JPG (max 10MB)
                </p>
            </div>
        </div>
    );
}
