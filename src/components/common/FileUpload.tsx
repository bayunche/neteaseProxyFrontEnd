import React, { useRef, useState } from 'react';
import { Upload, Music, X, FileAudio } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';
import type { Song } from '../../types';

interface FileUploadProps {
  onFileUpload: (songs: Song[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = 'audio/*',
  multiple = true,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
      alert('请选择有效的音频文件');
      return;
    }

    setUploadedFiles(prev => [...prev, ...audioFiles]);
    processAudioFiles(audioFiles);
  };

  const processAudioFiles = async (files: File[]) => {
    const songs: Song[] = [];

    for (const file of files) {
      try {
        const audioUrl = URL.createObjectURL(file);
        const duration = await getAudioDuration(audioUrl);
        
        const song: Song = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
          artist: '本地文件',
          album: '本地音乐',
          duration: Math.round(duration),
          coverUrl: 'https://via.placeholder.com/300x300?text=Local+Audio',
          audioUrl,
          source: 'local',
          quality: '320k' // 假设本地文件是高质量的
        };

        songs.push(song);
      } catch (error) {
        console.error('处理音频文件失败:', file.name, error);
      }
    }

    if (songs.length > 0) {
      onFileUpload(songs);
    }
  };

  const getAudioDuration = (audioUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      const handleLoadedMetadata = () => {
        cleanup();
        resolve(audio.duration || 0);
      };
      
      const handleError = () => {
        cleanup();
        resolve(180); // 默认3分钟
      };

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.src = '';
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      // 设置超时
      setTimeout(() => {
        cleanup();
        resolve(180); // 默认3分钟
      }, 5000);
      
      audio.src = audioUrl;
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 文件上传区域 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            isDragging
              ? "bg-primary-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragging ? '释放文件以上传' : '上传音频文件'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              支持 MP3, WAV, OGG, M4A, AAC, FLAC 格式
            </p>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            icon={<FileAudio className="w-4 h-4" />}
          >
            选择文件
          </Button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            已上传的文件 ({uploadedFiles.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Music className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;