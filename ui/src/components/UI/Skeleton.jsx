import React from 'react';
import './Skeleton.css';

// Base skeleton component
export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px', 
  className = '',
  style = {} 
}) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

// Card skeleton for entity cards
export const EntityCardSkeleton = () => {
  return (
    <div className="entity-card neumorphic-card skeleton-card">
      <div className="entity-card-content">
        <div className="entity-image-placeholder">
          <Skeleton width="100%" height="200px" borderRadius="15px" />
        </div>
        <div className="entity-details mt-3">
          <Skeleton width="80%" height="24px" className="mb-2" />
          <Skeleton width="60%" height="16px" className="mb-2" />
          <Skeleton width="40%" height="14px" className="mb-3" />
          <div className="entity-actions d-flex gap-2">
            <Skeleton width="80px" height="32px" borderRadius="15px" />
            <Skeleton width="80px" height="32px" borderRadius="15px" />
          </div>
        </div>
      </div>
    </div>
  );
};

// List skeleton for entity lists
export const EntityListSkeleton = ({ count = 6 }) => {
  return (
    <div className="entity-list-skeleton">
      <div className="row">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="col-lg-4 col-md-6 mb-4">
            <EntityCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard header skeleton
export const DashboardHeaderSkeleton = () => {
  return (
    <div className="dashboard-header neumorphic-card skeleton-card">
      <div className="user-info">
        <div className="user-avatar">
          <Skeleton width="60px" height="60px" borderRadius="50%" />
        </div>
        <div className="user-details ms-3">
          <Skeleton width="200px" height="28px" className="mb-2" />
          <Skeleton width="150px" height="20px" className="mb-1" />
          <Skeleton width="100px" height="16px" />
        </div>
      </div>
      <div className="header-actions">
        <Skeleton width="100px" height="36px" borderRadius="15px" className="me-2" />
        <Skeleton width="80px" height="36px" borderRadius="15px" />
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="form-skeleton neumorphic-card skeleton-card">
      <div className="form-header mb-4">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="300px" height="16px" />
      </div>
      
      <div className="form-body">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="form-group mb-3">
            <Skeleton width="120px" height="16px" className="mb-2" />
            <Skeleton width="100%" height="40px" borderRadius="15px" />
          </div>
        ))}
        
        <div className="form-actions mt-4 d-flex gap-2">
          <Skeleton width="100px" height="40px" borderRadius="15px" />
          <Skeleton width="80px" height="40px" borderRadius="15px" />
        </div>
      </div>
    </div>
  );
};

// Navigation skeleton
export const NavSkeleton = () => {
  return (
    <div className="nav-skeleton d-flex gap-3 mb-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton 
          key={index} 
          width="80px" 
          height="32px" 
          borderRadius="15px" 
        />
      ))}
    </div>
  );
};

// Stats card skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="stats-card neumorphic-card skeleton-card">
      <div className="d-flex align-items-center">
        <div className="stats-icon me-3">
          <Skeleton width="40px" height="40px" borderRadius="50%" />
        </div>
        <div className="stats-content">
          <Skeleton width="60px" height="24px" className="mb-1" />
          <Skeleton width="80px" height="16px" />
        </div>
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="table-skeleton neumorphic-card skeleton-card">
      <div className="table-header mb-3">
        <div className="row">
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className="col">
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="table-body">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="row mb-2">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="col">
                <Skeleton 
                  width={colIndex === 0 ? "60%" : "90%"} 
                  height="14px" 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Details page skeleton
export const DetailsSkeleton = () => {
  return (
    <div className="details-skeleton">
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex align-items-center justify-content-between">
            <Skeleton width="120px" height="38px" borderRadius="0.25rem" />
            <div className="d-flex gap-2">
              <Skeleton width="80px" height="24px" borderRadius="0.25rem" />
              <Skeleton width="100px" height="24px" borderRadius="0.25rem" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          {/* Header Card */}
          <div className="card skeleton-card mb-4">
            <div className="card-body">
              <Skeleton width="70%" height="48px" className="mb-3" />
              <Skeleton width="90%" height="20px" className="mb-2" />
              <Skeleton width="60%" height="20px" className="mb-3" />
              <Skeleton width="200px" height="16px" />
            </div>
          </div>
          
          {/* Images Card */}
          <div className="card skeleton-card mb-4">
            <div className="card-header">
              <Skeleton width="150px" height="20px" />
            </div>
            <div className="card-body p-0">
              <Skeleton width="100%" height="400px" />
            </div>
          </div>
          
          {/* Attributes Card */}
          <div className="card skeleton-card">
            <div className="card-header">
              <Skeleton width="100px" height="20px" />
            </div>
            <div className="card-body">
              <div className="row">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="col-md-6 mb-3">
                    <div className="attribute-item">
                      <Skeleton width="80px" height="14px" className="mb-2" />
                      <Skeleton width="120px" height="16px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Info Card */}
          <div className="card skeleton-card mb-4">
            <div className="card-header">
              <Skeleton width="140px" height="18px" />
            </div>
            <div className="card-body">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="mb-3">
                  <Skeleton width="60px" height="12px" className="mb-1" />
                  <Skeleton width="100px" height="16px" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions Card */}
          <div className="card skeleton-card">
            <div className="card-header">
              <Skeleton width="80px" height="18px" />
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} width="100%" height="36px" borderRadius="0.25rem" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
