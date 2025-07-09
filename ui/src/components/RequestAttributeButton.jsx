import { useState } from 'react';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { requestAttributeAPI } from '../services/api';

const RequestAttributeButton = ({ attributeName, entityId, currentUser, entityOwner, tenantId }) => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [hasRequested, setHasRequested] = useState(false);

  // Don't show button if user is not logged in or is the owner
  if (!currentUser || (entityOwner && currentUser.id === entityOwner)) {
    return null;
  }

  // Don't show button if already requested
  if (hasRequested) {
    return (
      <Button 
        variant="outline-success" 
        size="sm"
        disabled
        className="request-attribute-btn"
      >
        <i className="fas fa-check me-1"></i>
        Requested
      </Button>
    );
  }

  const handleRequest = async () => {
    setLoading(true);
    
    try {
      await requestAttributeAPI.requestAttributeInfo(attributeName, entityId, tenantId);
      
      setToastMessage('Information request sent successfully! The entity owner will be notified.');
      setToastVariant('success');
      setHasRequested(true);
    } catch (error) {
      console.error('Error sending request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send request.';
      setToastMessage(errorMessage);
      setToastVariant('danger');
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  return (
    <>
      <Button 
        variant="outline-info" 
        size="sm"
        onClick={handleRequest} 
        disabled={loading}
        className="request-attribute-btn"
        title={`Request more information about ${attributeName}`}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin me-1"></i>
            Requesting...
          </>
        ) : (
          <>
            <i className="fas fa-envelope me-1"></i>
            Request Info
          </>
        )}
      </Button>

      <ToastContainer position="top-end" className="position-fixed" style={{ zIndex: 1050 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={4000} 
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === 'success' ? 'Success' : 'Error'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toastVariant === 'success' ? 'text-white' : 'text-white'}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default RequestAttributeButton;

