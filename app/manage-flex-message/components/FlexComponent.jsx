"use client";
import React from 'react';

// --- 1. Helpers ---
const getSpacing = (size) => {
  const spaceMap = { none: '0px', xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '20px' };
  return spaceMap[size] || size || '0px';
};

const getSize = (size, type) => {
  if (type === 'image-width') {
     const map = { 
         xxs: '40px', xs: '60px', 
         sm: '80px',  
         md: '100px', 
         lg: '120px',  
         xl: '140px', 
         xxl: '160px', 
         '3xl': '180px', 
         '4xl': '200px', 
         '5xl': '220px', 
         full: '100%' 
     };
     return map[size] || '100%';
  }
  if (type === 'text') {
    const map = { xxs: '11px', xs: '12px', sm: '14px', md: '16px', lg: '19px', xl: '22px', xxl: '29px', '3xl': '35px', '4xl': '48px', '5xl': '74px' };
    return map[size] || '16px';
  }
  if (type === 'width') {
    const map = { xxs: '20%', xs: '40%', sm: '60%', md: '80%', lg: '100%', xl: '100%', xxl: '100%', full: '100%' };
    return map[size] || size || '100%';
  }
  return size;
};

const getCornerRadius = (size) => {
  const radiusMap = { none: '0px', xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '20px', '100px': '100px' };
  return radiusMap[size] || size || '0px';
};

// Helper: Checks if a value is defined (Respects '0px', 'none', and 0)
const isDefined = (val) => val !== undefined && val !== null;

// --- 2. Common Styles ---
const getCommonStyles = (node, parentLayout) => {
  const style = {};
  if (node.position === 'absolute') {
    style.position = 'absolute';
    if (node.offsetTop) style.top = node.offsetTop;
    if (node.offsetBottom) style.bottom = node.offsetBottom;
    if (node.offsetStart) style.left = node.offsetStart;
    if (node.offsetEnd) style.right = node.offsetEnd;
  } else {
    style.position = 'relative';
  }
  if (node.margin && node.position !== 'absolute') {
    const mVal = getSpacing(node.margin);
    if (parentLayout === 'horizontal' || parentLayout === 'baseline') style.marginLeft = mVal;
    else style.marginTop = mVal;
  }
  if (node.position !== 'absolute') {
    if (node.flex === 0) style.flex = '0 0 auto';
    else if (typeof node.flex === 'number') style.flex = `${node.flex} 1 0%`;
    else if (parentLayout === 'horizontal') style.flex = '0 1 auto';
  }
  if (parentLayout === 'vertical') {
     if (node.align === 'center') style.alignSelf = 'center';
     if (node.align === 'end') style.alignSelf = 'flex-end';
     if (node.align === 'start') style.alignSelf = 'flex-start';
  } else if (parentLayout === 'horizontal' || parentLayout === 'baseline') {
     if (node.align === 'end') style.marginLeft = 'auto'; 
     if (node.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }
     if (node.gravity === 'center') style.alignSelf = 'center';
     if (node.gravity === 'bottom') style.alignSelf = 'flex-end';
     if (node.gravity === 'top') style.alignSelf = 'flex-start';
  }
  if (node.action) style.cursor = 'pointer';
  if (node.shadow) style.boxShadow = node.shadow;
  if (node.boxShadow) style.boxShadow = node.boxShadow;
  return style;
};

// --- 3. FlexBox ---
const FlexBox = ({ node, parentLayout, section }) => {
  const isHorizontal = node.layout === 'horizontal' || node.layout === 'baseline';
  let defaultWidth = parentLayout === 'vertical' ? '100%' : 'auto';
  if (node.width) defaultWidth = getSize(node.width, 'width');
  if (node.position === 'absolute') defaultWidth = (!node.contents || node.contents.length === 0) ? '100%' : 'auto';

  const style = {
    ...getCommonStyles(node, parentLayout),
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    boxSizing: 'border-box',
    backgroundColor: node.backgroundColor || 'transparent',
    width: defaultWidth,
    height: node.height || 'auto',
    minWidth: 0, 
  };

  if (node.width) {
      style.flexShrink = 0; 
      style.flexGrow = 0;
  }

  // Smart Default Padding Logic
  const isRootBox = !!section;
  const hasPaddingAll = isDefined(node.paddingAll);
  
  if (hasPaddingAll) {
    style.padding = getSpacing(node.paddingAll);
  } else {
    const pTop = isDefined(node.paddingTop) ? getSpacing(node.paddingTop) : (isRootBox ? '19px' : undefined);
    const pBottom = isDefined(node.paddingBottom) ? getSpacing(node.paddingBottom) : (isRootBox ? '20px' : undefined);
    const pLeft = isDefined(node.paddingStart || node.paddingLeft) ? getSpacing(node.paddingStart || node.paddingLeft) : (isRootBox ? '20px' : undefined);
    const pRight = isDefined(node.paddingEnd || node.paddingRight) ? getSpacing(node.paddingEnd || node.paddingRight) : (isRootBox ? '20px' : undefined);

    if (pTop) style.paddingTop = pTop;
    if (pBottom) style.paddingBottom = pBottom;
    if (pLeft) style.paddingLeft = pLeft;
    if (pRight) style.paddingRight = pRight;
  }

  if (section === 'body') {
      style.flexGrow = 1; 
  }

  if (node.cornerRadius) { style.borderRadius = getCornerRadius(node.cornerRadius); style.overflow = 'hidden'; }
  if (node.borderColor) style.borderColor = node.borderColor;
  if (node.borderWidth) { style.borderWidth = node.borderWidth; style.borderStyle = 'solid'; }

  const justifyMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'space-between':'space-between' };

  // This removes the white gaps above/below the right-side images by forcing them to fill the height.
  const alignMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'baseline':'baseline' };
  
  style.justifyContent = justifyMap[node.justifyContent] || 'flex-start';
  
  // Logic: If horizontal, default to 'stretch'. If vertical, default to 'stretch' (unless aligned otherwise).
  style.alignItems = alignMap[node.alignItems] || (isHorizontal ? 'stretch' : 'stretch'); 
  
  if (node.spacing) style.gap = getSpacing(node.spacing);

  const bgStyle = {};
  if (node.background?.type === 'linearGradient') {
      bgStyle.background = `linear-gradient(${node.background.angle || '0deg'}, ${node.background.startColor}, ${node.background.endColor})`;
  }

  const handleClick = (e) => {
    if (node.action) { e.stopPropagation(); console.log('Action triggered:', node.action); }
  };

  return (
    <div style={{...style, ...bgStyle}} onClick={handleClick} className={node.action ? "hover:opacity-90 active:scale-[0.99] transition-all duration-100" : ""}>
      {node.contents?.map((child, i) => <FlexNode key={i} node={child} parentLayout={node.layout} />)}
    </div>
  );
};

// --- 4. Other Components ---
const FlexText = ({ node, parentLayout }) => {
  const style = {
    ...getCommonStyles(node, parentLayout),
    color: node.color || '#000000',
    fontSize: getSize(node.size, 'text'),
    fontWeight: node.weight === 'bold' ? 700 : 400,
    textAlign: node.align || 'left',
    whiteSpace: node.wrap ? 'pre-wrap' : 'nowrap',
    wordBreak: node.wrap ? 'break-word' : 'normal',
    overflow: node.wrap ? 'visible' : 'hidden',
    textOverflow: node.wrap ? 'clip' : 'ellipsis',
    lineHeight: 1.4,
    flexShrink: 0,
    minWidth: 0,
  };
  if (node.decoration === 'underline') style.textDecoration = 'underline';
  if (node.decoration === 'line-through') style.textDecoration = 'line-through';
  if (node.style === 'italic') style.fontStyle = 'italic';
  
  if (node.contents && node.contents.length > 0) {
      return (
          <div style={style}>
              {node.contents.map((span, i) => (
                  <span key={i} style={{
                      color: span.color || node.color,
                      fontSize: getSize(span.size || node.size, 'text'),
                      fontWeight: span.weight === 'bold' ? 700 : 400,
                      textDecoration: span.decoration || node.decoration,
                      fontStyle: span.style || node.style
                  }}>
                      {span.text}
                  </span>
              ))}
          </div>
      );
  }
  return <div style={style}>{node.text}</div>;
};

const FlexImage = ({ node, parentLayout }) => {
  const isIcon = node.type === 'icon';
  const sizeType = isIcon ? 'icon-size' : 'image-width';
  
  const hasFlex = node.flex !== undefined && node.flex !== 0;
  const calculatedWidth = hasFlex 
      ? '100%' 
      : (node.size === 'full' ? '100%' : getSize(node.size, sizeType));

  const style = {
    ...getCommonStyles(node, parentLayout),
    display: 'block',
    objectFit: node.aspectMode === 'cover' ? 'cover' : 'contain',
    width: calculatedWidth, 
    height: node.aspectMode === 'cover' ? '100%' : 'auto',
    verticalAlign: 'bottom',
    maxWidth: '100%',
    minWidth: 0, 
  };
  if (node.aspectRatio) style.aspectRatio = node.aspectRatio.replace(':', '/');
  return <img src={node.url} style={style} alt="Flex" />;
};

const FlexButton = ({ node, parentLayout }) => {
    const wrapperStyle = { ...getCommonStyles(node, parentLayout), width: '100%', cursor: 'pointer' };
    const color = node.color || '#1B437C';
    const btnStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', borderRadius: '4px',
        fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box', height: node.height === 'sm' ? '30px' : '40px',
        border: 'none', backgroundColor: 'transparent', color: color,
    };
    if (node.style === 'primary') { btnStyle.backgroundColor = color; btnStyle.color = '#fff'; }
    else if (node.style === 'secondary') { btnStyle.border = `1px solid ${color}`; }
    return <div style={wrapperStyle}><div style={btnStyle}>{node.action?.label || 'Button'}</div></div>;
};

const FlexSeparator = ({ node, parentLayout }) => {
    const color = node.color || '#eeeeee'; const marginVal = node.margin ? getSpacing(node.margin) : '0px'; 
    const style = { backgroundColor: color, flexShrink: 0, width: parentLayout === 'horizontal' ? '1px' : '100%', height: parentLayout === 'horizontal' ? '100%' : '1px' };
    if (parentLayout === 'horizontal') style.marginLeft = marginVal; else style.marginTop = marginVal;
    return <div style={style} />;
};

const FlexNode = ({ node, parentLayout = 'vertical', section = null }) => {
  if (!node) return null;

  switch (node.type) {
    case 'carousel':
        return (
            <div style={{ display:'flex', overflowX:'auto', gap:'12px', padding:'10px 12px 20px 12px', alignItems:'stretch', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
                {node.contents.map((bubble, i) => {
                    const sizeMap = { nano: '120px', micro: '160px', kilo: '260px', mega: '300px', giga: '300px' };
                    const cardWidth = sizeMap[bubble.size] || '300px';
                    return (
                        <div key={i} style={{ minWidth: cardWidth, width: cardWidth, flexShrink: 0, display:'flex', flexDirection:'column', scrollSnapAlign: 'center' }}>
                            <FlexNode node={bubble} />
                        </div>
                    );
                })}
            </div>
        );
    case 'bubble':
        const sizeMap = { nano: '120px', micro: '160px', kilo: '260px', mega: '300px', giga: '340px' };
        const bubbleWidth = sizeMap[node.size] || '300px';
        const bubbleStyle = {
            display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: node.backgroundColor || '#ffffff',
            borderRadius: '17px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'relative', height: '100%', flex: 1, 
            width: bubbleWidth, minWidth: bubbleWidth, flexShrink: 0, boxSizing: 'border-box'
        };

        return (
            <div style={bubbleStyle} className="fl-bubble">
                {node.hero && <div style={{width:'100%', lineHeight:0}}><FlexNode node={node.hero} parentLayout="vertical"/></div>}
                
                {node.header && (
                    <div style={{width: '100%'}}>
                        <FlexNode node={node.header} parentLayout="vertical" section="header"/>
                    </div>
                )}
                
                {node.body && (
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                        <FlexNode node={node.body} parentLayout="vertical" section="body"/>
                    </div>
                )}

                {node.footer && (
                    <div style={{marginTop:'auto', width: '100%'}}>
                        <FlexNode node={node.footer} parentLayout="vertical" section="footer"/>
                    </div>
                )}
            </div>
        );
    case 'box': return <FlexBox node={node} parentLayout={parentLayout} section={section} />;
    case 'text': return <FlexText node={node} parentLayout={parentLayout} />;
    case 'image': case 'icon': return <FlexImage node={node} parentLayout={parentLayout} />;
    case 'button': return <FlexButton node={node} parentLayout={parentLayout} />;
    case 'separator': return <FlexSeparator node={node} parentLayout={parentLayout} />;
    case 'filler': return <div style={{flex:1}} />;
    default: return null;
  }
};
export default FlexNode;