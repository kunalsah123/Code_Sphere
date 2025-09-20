import { useParams } from 'react-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import { FaFileVideo, FaCheckCircle, FaExclamationTriangle, FaTimes, FaUpload, FaSpinner } from 'react-icons/fa';

function AdminUpload() {

    const { problemId } = useParams();

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedVideo, setUploadedVideo] = useState(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setError,
        clearErrors
    } = useForm();

    const selectedFile = watch('videoFile')?.[0];

    // Upload video to Cloudinary
    const onSubmit = async (data) => {
        const file = data.videoFile[0];

        setUploading(true);
        setUploadProgress(0);
        clearErrors();

        try {
            // Step 1: Get upload signature from backend
            const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
            const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;

            // Step 2: Create FormData for Cloudinary upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature', signature);
            formData.append('timestamp', timestamp);
            formData.append('public_id', public_id);
            formData.append('api_key', api_key);

            // Step 3: Upload directly to Cloudinary
            const uploadResponse = await axios.post(upload_url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                },
            });

            const cloudinaryResult = uploadResponse.data;

            // Step 4: Save video metadata to backend
            const metadataResponse = await axiosClient.post('/video/save', {
                problemId: problemId,
                cloudinaryPublicId: cloudinaryResult.public_id,
                secureUrl: cloudinaryResult.secure_url,
                duration: cloudinaryResult.duration,
            });

            setUploadedVideo(metadataResponse.data.videoSolution);
            reset(); // Reset form after successful upload

        } catch (err) {
            console.error('Upload error:', err);
            setError('root', {
                type: 'manual',
                message: err.response?.data?.message || 'Upload failed. Please try again.'
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 py-12">
            <div className="max-w-xl mx-auto p-6">
                <div className="bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-800">
                    <div className="card-body p-0">
                        <h2 className="text-3xl font-bold mb-6 text-gray-100 text-center">
                            Upload Video Solution
                        </h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* File Input */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-gray-400">Choose video file</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        {...register('videoFile', {
                                            required: 'Please select a video file',
                                            validate: {
                                                isVideo: (files) => {
                                                    if (!files || !files[0]) return 'Please select a video file';
                                                    const file = files[0];
                                                    return file.type.startsWith('video/') || 'Please select a valid video file';
                                                },
                                                fileSize: (files) => {
                                                    if (!files || !files[0]) return true;
                                                    const file = files[0];
                                                    const maxSize = 100 * 1024 * 1024; // 100MB
                                                    return file.size <= maxSize || 'File size must be less than 100MB';
                                                }
                                            }
                                        })}
                                        className="hidden"
                                        id="video-file-input"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="video-file-input"
                                        className={`flex items-center justify-center p-4 rounded-xl border-2 border-dashed ${errors.videoFile ? 'border-red-500' : 'border-gray-700'} cursor-pointer text-gray-400 transition-colors duration-200 hover:border-blue-500`}
                                    >
                                        <FaFileVideo className="h-8 w-8 mr-4" />
                                        <span>
                                            {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop your video here, or click to browse'}
                                        </span>
                                    </label>
                                </div>
                                {errors.videoFile && (
                                    <span className="text-red-500 text-sm mt-2 ml-1">{errors.videoFile.message}</span>
                                )}
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <progress
                                        className="progress progress-primary w-full bg-gray-700"
                                        value={uploadProgress}
                                        max="100"
                                    ></progress>
                                </div>
                            )}

                            {/* Error Message */}
                            {errors.root && (
                                <div className="flex items-center p-4 rounded-lg bg-red-600/20 border border-red-500/50 text-red-400">
                                    <FaExclamationTriangle className="h-5 w-5 mr-3" />
                                    <span>{errors.root.message}</span>
                                </div>
                            )}

                            {/* Success Message */}
                            {uploadedVideo && (
                                <div className="flex items-center p-4 rounded-lg bg-green-600/20 border border-green-500/50 text-green-400">
                                    <FaCheckCircle className="h-5 w-5 mr-3" />
                                    <div>
                                        <h3 className="font-bold">Upload Successful!</h3>
                                        <p className="text-sm">Duration: {formatDuration(uploadedVideo.duration)}</p>
                                        <p className="text-sm">Uploaded: {new Date(uploadedVideo.uploadedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
                            <div className="card-actions justify-end">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`btn btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2 ${uploading ? 'bg-blue-600/50 cursor-not-allowed' : ''}`}
                                >
                                    {uploading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FaUpload />
                                            Upload Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUpload;