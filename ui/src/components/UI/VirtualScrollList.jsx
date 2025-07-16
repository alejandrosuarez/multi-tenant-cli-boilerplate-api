import { useState, useEffect, useRef, useMemo } from 'react';
import './VirtualScrollList.css';

const VirtualScrollList = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleRange = useMemo(() => {
    const containerHeight_ = containerHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight_ / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight
        }
      });
    }
    return result;
  }, [visibleRange, items, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e, newScrollTop);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      {...props}
    >
      <div
        className="virtual-scroll-content"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style} className="virtual-scroll-item">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualScrollList;