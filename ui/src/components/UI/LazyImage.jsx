import { useState, useRef, useEffect } from 'react';
import './LazyImage.css';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder = '/placeholder.svg',
  className = '',
  style = {},
  onLoad,
  onError,
  threshold = 0.1,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={style}
      {...props}
    >
      {!isInView && (
        <div className="lazy-image-placeholder">
          <img 
            src={placeholder} 
            alt={alt}
            className="placeholder-img"
          />
        </div>
      )}
      
      {isInView && (
        <>
          {!isLoaded && !hasError && (
            <div className="lazy-image-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
          
          {hasError && (
            <div className="lazy-image-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Failed to load image</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LazyImage;