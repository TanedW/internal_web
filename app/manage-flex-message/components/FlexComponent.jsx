"use client";
import React from 'react';

// --- 1. Helpers ---
const getSpacing = (size) => {
  const spaceMap = { none: '0px', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '24px' };
  return spaceMap[size] || size || '0px';
};

const getSize = (size, type) => {
  if (type === 'text') {
    const map = { xxs: '11px', xs: '12px', sm: '14px', md: '16px', lg: '19px', xl: '22px', xxl: '29px', '3xl': '35px', '4xl': '48px', '5xl': '74px' };
    return map[size] || size || '16px';
  }
  if (type === 'width') {
    const map = { xxs: '20%', xs: '40%', sm: '60%', md: '80%', lg: '100%', xl: '100%', xxl: '100%', full: '100%' };
    return map[size] || size || '100%';
  }
  return size;
};

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
    if (parentLayout === 'horizontal' || parentLayout === 'baseline') {
      style.marginLeft = mVal;
    } else {
      style.marginTop = mVal;
    }
  }

  if (node.position !== 'absolute') {
    if (node.flex === 0) style.flex = '0 1 auto';
    else if (typeof node.flex === 'number') style.flex = `${node.flex} 1 0%`;
    else if (parentLayout === 'horizontal') style.flex = '0 1 auto';
  }

  // Justify & Align (Base)
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

  if (node.shadow) style.boxShadow = node.shadow;
  if (node.boxShadow) style.boxShadow = node.boxShadow;

  return style;
};

// --- 3. FlexBox ---
const FlexBox = ({ node, parentLayout }) => {
  const isHorizontal = node.layout === 'horizontal' || node.layout === 'baseline';
  let defaultWidth = node.layout === 'vertical' ? '100%' : 'auto';
  if (node.position === 'absolute') defaultWidth = (!node.contents || node.contents.length === 0) ? '100%' : 'auto';

  const style = {
    ...getCommonStyles(node, parentLayout),
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    boxSizing: 'border-box',
    backgroundColor: node.backgroundColor || 'transparent',
    width: node.width || defaultWidth,
    height: node.height || 'auto',
  };

  // ============================================================
  // 🎯 SMART INTERCEPT: Fixes Margin & Color
  // ============================================================
  
  const isTargetButton = node.action && node.paddingBottom === '3px';

  let childrenToRender = node.contents;

  if (isTargetButton) {
      // 1. Force Border Thickness (Padding)
      style.paddingTop = '2px';
      style.paddingLeft = '2px';
      style.paddingRight = '2px';
      // 🔴 FIX: Override the bottom margin to be thicker (4px) to create the shadow effect
      style.paddingBottom = '4px'; 

      // 2. Fix Inner Content (Color & Text)
      if (childrenToRender) {
          childrenToRender = childrenToRender.map(child => {
              const modifiedChild = { ...child };
              
              if (modifiedChild.type === 'box') {
                  // Force inner background to white
                  modifiedChild.backgroundColor = '#FFFFFF';
                  
                  // Force text to black
                  if (modifiedChild.contents) {
                      modifiedChild.contents = modifiedChild.contents.map(grandChild => {
                          if (grandChild.type === 'text') {
                              return { ...grandChild, color: '#000000' };
                          }
                          return grandChild;
                      });
                  }
              }
              return modifiedChild;
          });
      }
  }

  // Padding Logic (Standard)
  if (node.paddingAll) {
    style.padding = getSpacing(node.paddingAll);
  } else {
    // Only apply if not already set by the interceptor
    if (!style.paddingTop) style.paddingTop = getSpacing(node.paddingTop);
    if (!style.paddingRight) style.paddingRight = getSpacing(node.paddingEnd);
    
    // Ensure we don't overwrite our manual fix (4px) with the JSON's default (3px)
    if (!style.paddingBottom) style.paddingBottom = getSpacing(node.paddingBottom);

    if (!style.paddingLeft) style.paddingLeft = getSpacing(node.paddingStart);
  }

  if (node.cornerRadius) {
      style.borderRadius = node.cornerRadius;
      if (!node.shadow && !node.boxShadow) style.overflow = 'hidden';
  }

  if (node.borderColor) style.borderColor = node.borderColor;
  if (node.borderWidth) {
      style.borderWidth = node.borderWidth;
      style.borderStyle = 'solid';
  }

  const justifyMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'space-between':'space-between' };
  const alignMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'baseline':'baseline' };
  style.justifyContent = justifyMap[node.justifyContent] || 'flex-start';
  style.alignItems = alignMap[node.alignItems] || (isHorizontal ? 'center' : 'stretch'); 
  if (node.spacing) style.gap = getSpacing(node.spacing);

  const bgStyle = {};
  if (node.background?.type === 'linearGradient') {
      bgStyle.background = `linear-gradient(${node.background.angle || '0deg'}, ${node.background.startColor}, ${node.background.endColor})`;
  }

  return (
    <div style={{...style, ...bgStyle}}>
      {childrenToRender?.map((child, i) => <FlexNode key={i} node={child} parentLayout={node.layout} />)}
    </div>
  );
};

// --- 4. Other Components (Standard) ---
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
  };
  if (node.decoration === 'underline') style.textDecoration = 'underline';
  if (node.decoration === 'line-through') style.textDecoration = 'line-through';
  if (node.style === 'italic') style.fontStyle = 'italic';
  return <div style={style}>{node.text}</div>;
};

const FlexImage = ({ node, parentLayout }) => {
  const style = {
    ...getCommonStyles(node, parentLayout),
    display: 'block',
    objectFit: node.aspectMode === 'cover' ? 'cover' : 'contain',
    width: node.size === 'full' ? '100%' : getSize(node.size, 'width'),
    height: node.aspectMode === 'cover' ? '100%' : 'auto',
    verticalAlign: 'bottom',
  };
  if (node.aspectRatio) style.aspectRatio = node.aspectRatio.replace(':', '/');
  return <img src={node.url} style={style} alt="Flex" />;
};

const FlexButton = ({ node, parentLayout }) => {
    const wrapperStyle = { ...getCommonStyles(node, parentLayout), width: '100%', cursor: 'pointer' };
    const color = node.color || '#1B437C';
    const btnStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
        borderRadius: '4px', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
        height: node.height === 'sm' ? '30px' : '40px', border: 'none', backgroundColor: 'transparent', color: color,
    };
    if (node.style === 'primary') { btnStyle.backgroundColor = color; btnStyle.color = '#fff'; }
    else if (node.style === 'secondary') { btnStyle.border = `1px solid ${color}`; }
    return (
        <div style={wrapperStyle}><div style={btnStyle}>{node.action?.label || 'Button'}</div></div>
    );
};

const FlexSeparator = ({ node, parentLayout }) => {
    const color = node.color || '#eeeeee';
    const marginVal = node.margin ? getSpacing(node.margin) : '8px';
    const isHorizontalParent = parentLayout === 'horizontal';
    const style = { backgroundColor: color, flexShrink: 0, width: isHorizontalParent ? '1px' : '100%', height: isHorizontalParent ? '100%' : '1px' };
    if (isHorizontalParent) style.marginLeft = marginVal; else style.marginTop = marginVal;
    return <div style={style} />;
};

const FlexNode = ({ node, parentLayout = 'vertical' }) => {
  if (!node) return null;
  switch (node.type) {
    case 'carousel':
        return (
            <div style={{ display:'flex', overflowX:'auto', gap:'12px', padding:'10px 12px 20px 12px', alignItems:'stretch', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
                {node.contents.map((bubble, i) => {
                    const sizeMap = { nano: '120px', micro: '160px', kilo: '260px', mega: '300px', giga: '300px' };
                    const cardWidth = sizeMap[bubble.size] || '300px';
                    return (
                        <div key={i} style={{ minWidth: cardWidth, maxWidth: cardWidth, flexShrink:0, display:'flex', flexDirection:'column', scrollSnapAlign: 'center' }}>
                            <FlexNode node={bubble} />
                        </div>
                    );
                })}
            </div>
        );
    case 'bubble':
        const bubbleStyle = {
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            backgroundColor: node.backgroundColor || '#ffffff',
            borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative', height: '100%', flex: 1
        };
        if (node.size === 'mega') bubbleStyle.width = '300px';
        if (node.size === 'kilo') bubbleStyle.width = '260px';
        if (node.size === 'micro') bubbleStyle.width = '160px';
        if (node.size === 'nano') bubbleStyle.width = '120px';

        return (
            <div style={bubbleStyle} className="fl-bubble">
                {node.hero && <div style={{width:'100%', lineHeight:0}}><FlexNode node={node.hero} parentLayout="vertical"/></div>}
                {node.header && <div style={{padding:'15px', backgroundColor: node.header.backgroundColor}}><FlexNode node={node.header} parentLayout="vertical"/></div>}
                {node.body && <div style={{flex:1, display:'flex', flexDirection:'column', backgroundColor: node.body.backgroundColor}}><FlexNode node={node.body} parentLayout="vertical"/></div>}
                {node.footer && <div style={{marginTop:'auto', backgroundColor: node.footer.backgroundColor}}><FlexNode node={node.footer} parentLayout="vertical"/></div>}
            </div>
        );
    case 'box': return <FlexBox node={node} parentLayout={parentLayout} />;
    case 'text': return <FlexText node={node} parentLayout={parentLayout} />;
    case 'image': case 'icon': return <FlexImage node={node} parentLayout={parentLayout} />;
    case 'button': return <FlexButton node={node} parentLayout={parentLayout} />;
    case 'separator': return <FlexSeparator node={node} parentLayout={parentLayout} />;
    case 'filler': return <div style={{flex:1}} />;
    default: return null;
  }
};
export default FlexNode;