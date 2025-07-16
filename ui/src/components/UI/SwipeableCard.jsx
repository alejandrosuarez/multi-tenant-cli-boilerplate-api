import React, { useState, useRef } from 'react';
import useSwipeGestures from '../../hooks/useSwipeGestures';
import './SwipeableCard.css';

const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction,
  className = '',
  ...props 
}) => {
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const [isSwipedRight, setIsSwipedRight] = useState(false);

  const handleSwipeLeft = () => {
    if (onSwipeLeft) {
      setIsSwipedLeft(true);
      setTimeout(() => {
        onSwipeLeft();
        setIsSwipedLeft(false);
      }, 300);
    }
  };

  const handleSwipeRight = () => {
    if (onSwipeRight) {
      setIsSwipedRight(true);
      setTimeout(() => {
        onSwipeRight();
        setIsSwipedRight(false);
      }, 300);
    }
  };

  const swipeRef = useSwipeGestures(handleSwipeLeft, handleSwipeRight);

  return (
    <div 
      ref={swipeRef}
      className={`swipeable-card ${isSwipedLeft ? 'swiped-left' : ''} ${isSwipedRight ? 'swiped-right' : ''} ${className}`}
      {...props}
    >
      {leftAction && (
        <div className="swipe-action swipe-action--left">
          {leftAction}
        </div>
      )}
      
      <div className="swipeable-card__content">
        {children}
      </div>
      
      {rightAction && (
        <div className="swipe-action swipe-action--right">
          {rightAction}
        </div>
      )}
    </div>
  );
};

export default SwipeableCard;