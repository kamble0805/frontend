import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import './ImageUpload.css';

const ImageUpload = ({ onImagesChange, maxImages = 5, mediaType = 'other', description = '' }) => {
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addImages(files);
  };

  const addImages = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image size must be less than 10MB');
        return false;
      }
      return true;
    });

    const totalImages = images.length + validFiles.length;
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);

    // Notify parent component
    onImagesChange(newImages);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (event) => {
    const files = Array.from(event.target.files);
    addImages(files);
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-header">
        <h4>Upload Images</h4>
        <span className="image-count">{images.length}/{maxImages}</span>
      </div>

      <div className="upload-buttons">
        <button
          type="button"
          onClick={openCamera}
          className="upload-btn camera-btn"
          title="Take Photo"
        >
          <Camera size={20} />
          Camera
        </button>
        <button
          type="button"
          onClick={openFileDialog}
          className="upload-btn gallery-btn"
          title="Choose from Gallery"
        >
          <Upload size={20} />
          Gallery
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Image previews */}
      {previewUrls.length > 0 && (
        <div className="image-previews">
          {previewUrls.map((url, index) => (
            <div key={index} className="image-preview">
              <img src={url} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="remove-image-btn"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media type and description info */}
      <div className="upload-info">
        <div className="media-type">
          <ImageIcon size={16} />
          <span>Type: {mediaType.replace('_', ' ').toUpperCase()}</span>
        </div>
        {description && (
          <div className="description">
            <span>{description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
