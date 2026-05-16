import { cn } from "@KasFlow/ui/lib/utils";
import { FileText, UploadCloud, X } from "lucide-react";
import type React from "react";
import {
	type ChangeEvent,
	type DragEvent,
	type InputHTMLAttributes,
	useCallback,
	useRef,
	useState,
} from "react";

export type FileMetadata = {
	name: string;
	size: number;
	type: string;
	url: string;
	id: string;
};

export type FileWithPreview = {
	file: File | FileMetadata;
	id: string;
	preview?: string;
};

export type FileUploadOptions = {
	maxFiles?: number;
	maxSize?: number;
	accept?: string;
	multiple?: boolean;
	initialFiles?: FileMetadata[];
	onFilesChange?: (files: FileWithPreview[]) => void;
	onFilesAdded?: (addedFiles: FileWithPreview[]) => void;
};

export type FileUploadState = {
	files: FileWithPreview[];
	isDragging: boolean;
	errors: string[];
};

export type FileUploadActions = {
	addFiles: (files: FileList | File[]) => void;
	removeFile: (id: string) => void;
	clearFiles: () => void;
	clearErrors: () => void;
	handleDragEnter: (event: DragEvent<HTMLElement>) => void;
	handleDragLeave: (event: DragEvent<HTMLElement>) => void;
	handleDragOver: (event: DragEvent<HTMLElement>) => void;
	handleDrop: (event: DragEvent<HTMLElement>) => void;
	handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
	openFileDialog: () => void;
	getInputProps: (
		props?: InputHTMLAttributes<HTMLInputElement>,
	) => InputHTMLAttributes<HTMLInputElement> & {
		ref: React.Ref<HTMLInputElement>;
	};
};

export function useFileUpload(
	options: FileUploadOptions = {},
): [FileUploadState, FileUploadActions] {
	const {
		maxFiles = Number.POSITIVE_INFINITY,
		maxSize = Number.POSITIVE_INFINITY,
		accept = "*",
		multiple = false,
		initialFiles = [],
		onFilesChange,
		onFilesAdded,
	} = options;

	const [state, setState] = useState<FileUploadState>({
		files: initialFiles.map((file) => ({
			file,
			id: file.id,
			preview: file.url,
		})),
		isDragging: false,
		errors: [],
	});
	const inputRef = useRef<HTMLInputElement>(null);

	const validateFile = useCallback(
		(file: File | FileMetadata): string | null => {
			if (file.size > maxSize) {
				return `File "${file.name}" melebihi batas ${formatBytes(maxSize)}.`;
			}

			if (accept !== "*") {
				const acceptedTypes = accept.split(",").map((type) => type.trim());
				const fileType = file instanceof File ? file.type || "" : file.type;
				const fileExtension = `.${file.name.split(".").pop() ?? ""}`;
				const isAccepted = acceptedTypes.some((type) => {
					if (type.startsWith(".")) {
						return fileExtension.toLowerCase() === type.toLowerCase();
					}
					if (type.endsWith("/*")) {
						return fileType.startsWith(`${type.split("/")[0]}/`);
					}
					return fileType === type;
				});

				if (!isAccepted) {
					return `File "${file.name}" bukan tipe yang didukung.`;
				}
			}

			return null;
		},
		[accept, maxSize],
	);

	const createPreview = useCallback(
		(file: File | FileMetadata): string | undefined => {
			if (file instanceof File) {
				return URL.createObjectURL(file);
			}
			return file.url;
		},
		[],
	);

	const generateUniqueId = useCallback((file: File | FileMetadata): string => {
		if (file instanceof File) {
			return `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
		}
		return file.id;
	}, []);

	const clearFiles = useCallback(() => {
		setState((previous) => {
			for (const file of previous.files) {
				if (file.preview && file.file instanceof File) {
					URL.revokeObjectURL(file.preview);
				}
			}

			if (inputRef.current) {
				inputRef.current.value = "";
			}

			onFilesChange?.([]);
			return { ...previous, files: [], errors: [] };
		});
	}, [onFilesChange]);

	const addFiles = useCallback(
		(newFiles: FileList | File[]) => {
			if (!newFiles || newFiles.length === 0) {
				return;
			}

			const nextFiles = Array.from(newFiles);
			const errors: string[] = [];
			const validFiles: FileWithPreview[] = [];

			if (
				multiple &&
				maxFiles !== Number.POSITIVE_INFINITY &&
				state.files.length + nextFiles.length > maxFiles
			) {
				setState((previous) => ({
					...previous,
					errors: [`Maksimal ${maxFiles} file.`],
				}));
				return;
			}

			for (const file of nextFiles) {
				if (
					multiple &&
					state.files.some(
						(existingFile) =>
							existingFile.file.name === file.name &&
							existingFile.file.size === file.size,
					)
				) {
					continue;
				}

				const error = validateFile(file);
				if (error) {
					errors.push(error);
				} else {
					validFiles.push({
						file,
						id: generateUniqueId(file),
						preview: createPreview(file),
					});
				}
			}

			setState((previous) => {
				const files = multiple
					? [...previous.files, ...validFiles]
					: validFiles.slice(0, 1);
				onFilesChange?.(files);
				if (validFiles.length > 0) {
					onFilesAdded?.(validFiles);
				}
				return { ...previous, files, errors, isDragging: false };
			});
		},
		[
			createPreview,
			generateUniqueId,
			maxFiles,
			multiple,
			onFilesAdded,
			onFilesChange,
			state.files,
			validateFile,
		],
	);

	const removeFile = useCallback(
		(id: string) => {
			setState((previous) => {
				const fileToRemove = previous.files.find((file) => file.id === id);
				if (fileToRemove?.preview && fileToRemove.file instanceof File) {
					URL.revokeObjectURL(fileToRemove.preview);
				}

				const files = previous.files.filter((file) => file.id !== id);
				onFilesChange?.(files);
				return { ...previous, files, errors: [] };
			});
		},
		[onFilesChange],
	);

	const clearErrors = useCallback(() => {
		setState((previous) => ({ ...previous, errors: [] }));
	}, []);

	const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setState((previous) => ({ ...previous, isDragging: true }));
	}, []);

	const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.currentTarget.contains(event.relatedTarget as Node)) {
			return;
		}
		setState((previous) => ({ ...previous, isDragging: false }));
	}, []);

	const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			addFiles(event.dataTransfer.files);
		},
		[addFiles],
	);

	const handleFileChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (event.target.files) {
				addFiles(event.target.files);
			}
		},
		[addFiles],
	);

	const openFileDialog = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const getInputProps = useCallback(
		(props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
			...props,
			type: "file",
			accept,
			multiple,
			onChange: handleFileChange,
			ref: inputRef,
		}),
		[accept, handleFileChange, multiple],
	);

	return [
		state,
		{
			addFiles,
			removeFile,
			clearFiles,
			clearErrors,
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			handleFileChange,
			openFileDialog,
			getInputProps,
		},
	];
}

export function StatementFileUpload({
	maxSize = 15 * 1024 * 1024,
	onFileSelect,
	selectedFile,
	disabled,
	className,
}: {
	maxSize?: number;
	onFileSelect: (file: File | null) => void;
	selectedFile?: File | null;
	disabled?: boolean;
	className?: string;
}) {
	const [{ files, isDragging, errors }, actions] = useFileUpload({
		maxFiles: 1,
		maxSize,
		accept: "application/pdf,.pdf",
		multiple: false,
		onFilesChange: (nextFiles) => {
			const firstFile = nextFiles[0]?.file;
			onFileSelect(firstFile instanceof File ? firstFile : null);
		},
	});
	const activeFile =
		selectedFile ?? (files[0]?.file instanceof File ? files[0].file : null);

	return (
		<div className={cn("space-y-4", className)}>
			<button
				type="button"
				disabled={disabled}
				onClick={actions.openFileDialog}
				onDragEnter={actions.handleDragEnter}
				onDragLeave={actions.handleDragLeave}
				onDragOver={actions.handleDragOver}
				onDrop={actions.handleDrop}
				className={cn(
					"flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-8 text-center transition-colors",
					isDragging && "border-primary bg-slate-100",
					disabled
						? "cursor-not-allowed opacity-60"
						: "cursor-pointer hover:bg-slate-100",
				)}
			>
				<input {...actions.getInputProps({ className: "sr-only", disabled })} />
				<UploadCloud className="mb-4 size-10 text-slate-500" />
				<h2 className="font-semibold">Pilih atau drop file PDF BCA</h2>
				<p className="mt-2 max-w-sm text-muted-foreground text-sm leading-6">
					Maksimal {formatBytes(maxSize)}. Untuk tahap awal, gunakan laporan BCA
					dengan text layer.
				</p>
			</button>

			{activeFile && (
				<div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
							<FileText className="size-4" />
						</div>
						<div className="min-w-0">
							<p className="truncate font-medium text-sm">{activeFile.name}</p>
							<p className="text-muted-foreground text-xs">
								{formatBytes(activeFile.size)}
							</p>
						</div>
					</div>
					<button
						type="button"
						className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-slate-100"
						onClick={() => {
							actions.clearFiles();
							onFileSelect(null);
						}}
						aria-label="Hapus file"
					>
						<X className="size-4" />
					</button>
				</div>
			)}

			{errors.length > 0 && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
					{errors[0]}
				</div>
			)}
		</div>
	);
}

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) {
		return "0 Byte";
	}
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const index = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${Number.parseFloat((bytes / 1024 ** index).toFixed(decimals))} ${sizes[index]}`;
}
