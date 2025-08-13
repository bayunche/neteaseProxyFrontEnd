import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { Button, Input, Modal } from '../common';
import type { Song } from '../../types';

interface CreatePlaylistProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSongs?: Record<string, unknown>[];
}

const CreatePlaylist: React.FC<CreatePlaylistProps> = ({
  isOpen,
  onClose,
  defaultSongs = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    coverUrl: ''
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { createPlaylist } = usePlayerStore();

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'isPublic' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        coverUrl: url
      }));
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setFormData(prev => ({
      ...prev,
      coverUrl: ''
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入播放列表名称';
    } else if (formData.title.trim().length > 50) {
      newErrors.title = '播放列表名称不能超过50个字符';
    }

    if (formData.description.length > 200) {
      newErrors.description = '描述不能超过200个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 这里应该上传封面图片到服务器
      // 暂时使用本地预览URL
      // let coverUrl = formData.coverUrl;
      
      if (coverFile && !formData.coverUrl.startsWith('blob:')) {
        // 实际项目中应该上传到CDN或服务器
        // coverUrl = await uploadImage(coverFile);
      }

      createPlaylist(
        formData.title.trim(),
        formData.description.trim(),
        defaultSongs as unknown as Song[]
      );

      // 重置表单
      setFormData({
        title: '',
        description: '',
        isPublic: false,
        coverUrl: ''
      });
      setCoverFile(null);
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('创建播放列表失败:', error);
      setErrors({ submit: '创建播放列表失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        isPublic: false,
        coverUrl: ''
      });
      setCoverFile(null);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="创建播放列表"
      size="md"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 封面上传 */}
        <div className="flex justify-center">
          <div className="relative">
            {formData.coverUrl ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                <img
                  src={formData.coverUrl}
                  alt="播放列表封面"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                  添加封面
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* 播放列表名称 */}
        <Input
          label="播放列表名称"
          value={formData.title}
          onChange={handleInputChange('title')}
          placeholder="请输入播放列表名称"
          error={errors.title}
          maxLength={50}
          required
        />

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述 (可选)
          </label>
          <textarea
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="介绍一下你的播放列表..."
            maxLength={200}
            rows={3}
            className={cn(
              "block w-full px-3 py-2.5 text-sm",
              "border border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "rounded-lg transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.description && "border-red-300 dark:border-red-600"
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.description.length}/200
          </p>
        </div>

        {/* 隐私设置 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={handleInputChange('isPublic')}
            className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            公开播放列表（其他用户可以看到）
          </label>
        </div>

        {/* 初始歌曲提示 */}
        {defaultSongs.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              将添加 {defaultSongs.length} 首歌曲到新播放列表
            </p>
          </div>
        )}

        {/* 错误信息 */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              {errors.submit}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!formData.title.trim()}
            className="flex-1"
            icon={<Plus className="w-4 h-4" />}
          >
            创建播放列表
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePlaylist;