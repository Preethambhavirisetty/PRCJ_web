import { forwardRef } from 'react';

const Image = forwardRef(function Image({ src, alt = '', fill, style, className, ...rest }, ref) {
  const mergedStyle = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style;

  return <img ref={ref} src={src} alt={alt} style={mergedStyle} className={className} {...rest} />;
});

export default Image;
