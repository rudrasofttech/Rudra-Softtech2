import React, { useRef, useEffect } from 'react';

/**
 * ExpandableTextarea
 * A textarea that expands its height based on content, with a minimum of 2 rows.
 * All standard HTML textarea props are supported via ...props.
 */

const ExpandableTextarea = React.forwardRef((props, ref) => {
  const { value, onChange, style, ...rest } = props;
  const textareaRef = useRef();
  // Forward the ref if provided
  React.useImperativeHandle(ref, () => textareaRef.current);

  // Adjust height based on content
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [value]);

  // Set minRows to 2 and calculate minHeight for exactly two lines
  const minRows = 2;
  // Try to get lineHeight from style or fallback to 24px
  const computedLineHeight = style && style.lineHeight ? parseInt(style.lineHeight, 10) : 24;
  const minHeight = minRows * computedLineHeight;

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      style={{
        minHeight: minHeight,
        maxHeight: 600,
        lineHeight: computedLineHeight + 'px',
        resize: 'vertical',
        overflow: 'hidden',
        overflowY: 'auto',
        ...style,
      }}
      rows={minRows}
      {...rest}
    />
  );
});

export default ExpandableTextarea;
