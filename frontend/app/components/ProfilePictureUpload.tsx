'use client';

import { useState, useRef, ChangeEvent } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string | null;
  walletAddress: string;
  onUploadSuccess?: (url: string, cid: string) => void;
  onDeleteSuccess?: () => void;
}

export default function ProfilePictureUpload({
  currentPictureUrl,
  walletAddress,
  onUploadSuccess,
  onDeleteSuccess
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG or PNG)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG and PNG images are supported');
      return;
    }

    // Validate file size (5MB max)
    const maxSizeMB = 5;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${API_URL}/api/profiles/picture/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess('Profile picture uploaded successfully!');
      setPreview(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess && response.data.url) {
        onUploadSuccess(response.data.url, response.data.cid);
      }
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.delete(`${API_URL}/api/profiles/picture`);

      setSuccess('Profile picture removed successfully');

      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      console.error('Error deleting profile picture:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to delete profile picture. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const cancelUpload = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>📸</span>
        Profile Picture
      </h2>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Current Picture Display */}
        <div className="flex flex-col items-center">
          {preview ? (
            // Preview of selected image
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 rounded-full object-cover border-4 border-purple-500"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <span className="text-white font-semibold">Preview</span>
              </div>
            </div>
          ) : currentPictureUrl ? (
            // Current profile picture
            <div className="relative">
              <img
                src={currentPictureUrl}
                alt="Profile"
                className="w-48 h-48 rounded-full object-cover border-4 border-purple-500"
              />
            </div>
          ) : (
            // Placeholder
            <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-6xl border-4 border-white/20">
              👤
            </div>
          )}
        </div>

        {/* Upload Controls */}
        {preview ? (
          // Preview controls
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {uploading ? 'Uploading...' : 'Upload to IPFS'}
            </button>
            <button
              onClick={cancelUpload}
              disabled={uploading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          // Upload/Delete controls
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-picture-input"
            />
            <label
              htmlFor="profile-picture-input"
              className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition text-center"
            >
              {currentPictureUrl ? 'Change Picture' : 'Upload Picture'}
            </label>

            {currentPictureUrl && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                {deleting ? 'Removing...' : 'Remove Picture'}
              </button>
            )}
          </div>
        )}

        {/* Info Text */}
        <div className="text-center text-sm text-gray-400 space-y-1">
          <p>Max size: 5MB</p>
          <p>Formats: JPEG, PNG</p>
          <p>Images will be resized to 1024x1024 max</p>
          <p className="text-xs text-purple-300 mt-2">
            Stored on IPFS for permanent, decentralized hosting
          </p>
        </div>
      </div>
    </div>
  );
}
