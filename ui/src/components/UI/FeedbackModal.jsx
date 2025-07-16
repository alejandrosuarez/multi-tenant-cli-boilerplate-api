import React, { useState } from 'react';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, onSubmit, type = 'general' }) => {
  const [feedback, setFeedback] = useState({
    type: type,
    rating: 0,
    category: '',
    message: '',
    email: '',
    includeSystemInfo: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const categories = {
    general: [
      'Bug Report',
      'Feature Request',
      'Performance Issue',
      'User Experience',
      'Documentation',
      'Other'
    ],
    error: [
      'Application Error',
      'Data Loss',
      'Performance Problem',
      'Unexpected Behavior',
      'Other'
    ]
  };

  const handleRatingClick = (rating) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const systemInfo = feedback.includeSystemInfo ? {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      } : null;

      await onSubmit({
        ...feedback,
        systemInfo
      });

      // Reset form
      setFeedback({
        type: type,
        rating: 0,
        category: '',
        message: '',
        email: '',
        includeSystemInfo: true
      });
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = feedback.rating > 0 && feedback.category;
  const canSubmit = feedback.message.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={e => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h3>Share Your Feedback</h3>
          <button 
            className="feedback-modal-close"
            onClick={onClose}
            aria-label="Close feedback modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="feedback-modal-progress">
          <div className={`feedback-progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="feedback-progress-line" />
          <div className={`feedback-progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        <form onSubmit={handleSubmit} className="feedback-modal-form">
          {step === 1 && (
            <div className="feedback-step">
              <h4>How was your experience?</h4>
              <div className="feedback-rating">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    className={`feedback-star ${feedback.rating >= rating ? 'active' : ''}`}
                    onClick={() => handleRatingClick(rating)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
              </div>

              <div className="feedback-category">
                <label htmlFor="category">What type of feedback is this?</label>
                <select
                  id="category"
                  value={feedback.category}
                  onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories[feedback.type].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="feedback-step-actions">
                <button
                  type="button"
                  className="feedback-button secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="feedback-button primary"
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="feedback-step">
              <h4>Tell us more</h4>
              
              <div className="feedback-message">
                <label htmlFor="message">Your feedback *</label>
                <textarea
                  id="message"
                  value={feedback.message}
                  onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please describe your experience, issue, or suggestion..."
                  rows={4}
                  required
                />
              </div>

              <div className="feedback-email">
                <label htmlFor="email">Email (optional)</label>
                <input
                  type="email"
                  id="email"
                  value={feedback.email}
                  onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
                <small>We'll only use this to follow up on your feedback</small>
              </div>

              <div className="feedback-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={feedback.includeSystemInfo}
                    onChange={(e) => setFeedback(prev => ({ ...prev, includeSystemInfo: e.target.checked }))}
                  />
                  Include system information to help us debug issues
                </label>
              </div>

              <div className="feedback-step-actions">
                <button
                  type="button"
                  className="feedback-button secondary"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="feedback-button primary"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;