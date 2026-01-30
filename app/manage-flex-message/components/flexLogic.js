// manage-flex-message/components/flexLogic.js

// 1. Helper: แปลงหน่วย Absolute Position
const getPositionStyle = (node) => {
  if (node.position === 'absolute') {
    let style = 'position:absolute; z-index:10; ';
    if (node.offsetTop !== undefined) style += `top:${node.offsetTop}; `;
    if (node.offsetBottom !== undefined) style += `bottom:${node.offsetBottom}; `;
    if (node.offsetStart !== undefined) style += `left:${node.offsetStart}; `;
    if (node.offsetEnd !== undefined) style += `right:${node.offsetEnd}; `;
    return style;
  }
  return 'position:relative; ';
};

// 2. Helper: แปลงหน่วย Spacing
const getSpacing = (size) => {
  const spaceMap = { none:'0px', xs:'4px', sm:'8px', md:'12px', lg:'16px', xl:'20px', xxl:'24px' };
  return spaceMap[size] || '0px';
};

// 3. Helper: แปลงหน่วย Size
const getSize = (size, type) => {
   if (type === 'text') {
      const map = { xxs:'11px', xs:'12px', sm:'14px', md:'16px', lg:'19px', xl:'22px', xxl:'29px', '3xl':'35px', '4xl':'48px', '5xl':'74px' };
      return map[size] || '16px';
   }
   if (type === 'width') {
      const map = { xxs:'20%', xs:'40%', sm:'60%', md:'80%', lg:'100%', xl:'100%', xxl:'100%', full:'100%' };
      return map[size] || '100%';
   }
   return size;
};

// 4. Helper: คำนวณ Flex (แก้บั๊กตัวหนังสือหาย)
const getFlexStyle = (flexValue, position) => {
    if (position === 'absolute') return ''; 
    if (flexValue === undefined) return 'flex-shrink: 0;'; 
    if (flexValue === 0) return 'flex: 0 1 auto;';
    return `flex: ${flexValue} 1 0%;`; 
};

// 5. Helper: คำนวณ Margin (แก้บั๊ก Margin เบี้ยว)
const getMarginStyle = (marginSize, parentLayout, position) => {
    if (!marginSize || position === 'absolute') return '';
    const sizePx = getSpacing(marginSize);
    if (parentLayout === 'horizontal' || parentLayout === 'baseline') {
        return `margin-left:${sizePx};`;
    }
    return `margin-top:${sizePx};`;
};

// 6. Helper: คำนวณ Align (จัดตำแหน่งชิดขอบ)
const getAlignStyle = (align, gravity, parentLayout) => {
    let style = '';
    
    // Horizontal Align
    if (align) {
        if (parentLayout === 'vertical') {
            if (align === 'center') style += 'align-self: center; ';
            if (align === 'end') style += 'align-self: flex-end; ';
            if (align === 'start') style += 'align-self: flex-start; ';
        } else {
            // แนวนอน: ใช้ margin-left: auto เพื่อดันไปขวาสุด
            if (align === 'end') style += 'margin-left: auto; ';
            if (align === 'center') style += 'margin-left: auto; margin-right: auto; ';
        }
    }

    // Vertical Gravity
    if (gravity) {
        if (parentLayout === 'horizontal' || parentLayout === 'baseline') {
             if (gravity === 'center') style += 'align-self: center; ';
             if (gravity === 'bottom') style += 'align-self: flex-end; ';
             if (gravity === 'top') style += 'align-self: flex-start; ';
        }
    }
    return style;
};


// --- Main Renderer ---
export const renderFlexHTML = (node, parentLayout = 'vertical') => {
  if (!node) return '';

  // A. CAROUSEL (เพิ่ม align-items: stretch ให้การ์ดยาวเท่ากัน)
  if (node.type === 'carousel') {
    let html = '<div class="fl-carousel" style="display:flex; overflow-x:auto; padding:10px 0; gap:12px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; align-items: stretch;">';
    if (node.contents) {
      node.contents.forEach(bubble => {
        // Wrapper ต้องเป็น flex column เพื่อให้ยืดเต็มความสูง
        html += `<div style="min-width:300px; max-width:300px; flex-shrink:0; scroll-snap-align:center; display:flex; flex-direction:column;">${renderFlexHTML(bubble, 'vertical')}</div>`;
      });
    }
    html += '</div>';
    return html;
  }

  // B. BUBBLE
  if (node.type === 'bubble') {
    const width = node.size ? `width:${node.size === 'mega' ? '300px' : 'auto'};` : '';
    const bg = node.backgroundColor || '#ffffff';
    // เพิ่ม height: 100% เพื่อให้การ์ดเต็มพื้นที่ wrapper
    let html = `<div class="fl-bubble" style="display:flex; flex-direction:column; overflow:hidden; background-color:${bg}; ${width} flex:1; height:100%; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.15); position:relative;">`;
    
    if (node.hero) html += `<div style="width:100%; line-height:0;">${renderFlexHTML(node.hero, 'vertical')}</div>`;
    
    if (node.header) {
        html += `<div style="background-color:${node.header.backgroundColor || 'transparent'}; padding:15px;">${renderFlexHTML(node.header, 'vertical')}</div>`;
    }
    // Body: ใส่ flex: 1 เพื่อดัน Footer ไปล่างสุด
    if (node.body) {
        html += `<div style="flex:1; background-color:${node.body.backgroundColor || 'transparent'}; display:flex; flex-direction:column;">${renderFlexHTML(node.body, 'vertical')}</div>`;
    }
    if (node.footer) {
        html += `<div style="background-color:${node.footer.backgroundColor || 'transparent'}; margin-top: auto;">${renderFlexHTML(node.footer, 'vertical')}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  // C. BOX
  if (node.type === 'box') {
    const isHorizontal = node.layout === 'horizontal' || node.layout === 'baseline';
    const currentDir = isHorizontal ? 'row' : 'column';
    const posStyle = getPositionStyle(node);
    
    let padding = '';
    if (node.paddingAll) {
        padding = `padding:${getSpacing(node.paddingAll)};`;
    } else {
        const pt = getSpacing(node.paddingTop);
        const pr = getSpacing(node.paddingEnd);
        const pb = getSpacing(node.paddingBottom);
        const pl = getSpacing(node.paddingStart);
        if (node.paddingTop || node.paddingEnd || node.paddingBottom || node.paddingStart) {
             padding = `padding:${pt} ${pr} ${pb} ${pl};`;
        }
    }

    let bg = '';
    if (node.background && node.background.type === 'linearGradient') {
        bg = `background: linear-gradient(${node.background.angle||'0deg'}, ${node.background.startColor}, ${node.background.endColor});`;
    } else if (node.backgroundColor) {
        bg = `background-color:${node.backgroundColor};`;
    }

    const spacing = node.spacing ? `gap:${getSpacing(node.spacing)};` : '';
    const flexStyle = getFlexStyle(node.flex, node.position);
    
    // 🔥 แก้บั๊กไอคอนหาย: ถ้าอยู่ในแนวนอน ห้ามบังคับ width 100% (ให้เป็น auto)
    let widthVal = 'width:100%;';
    if (node.width) {
        widthVal = `width:${node.width};`;
    } else if (node.position === 'absolute') {
        widthVal = 'width:fit-content;';
    } else if (parentLayout === 'horizontal' || parentLayout === 'baseline') {
        widthVal = 'width:auto;'; // <-- จุดสำคัญที่แก้ไอคอนตกขอบ
    }
    
    const height = node.height ? `height:${node.height};` : '';
    const corner = node.cornerRadius ? `border-radius:${node.cornerRadius}; overflow:hidden;` : '';

    const justifyMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'space-between':'space-between' };
    const alignMap = { 'flex-start':'flex-start', 'center':'center', 'flex-end':'flex-end', 'baseline':'baseline' };
    const justify = `justify-content:${justifyMap[node.justifyContent] || 'flex-start'};`;
    const align = `align-items:${alignMap[node.alignItems] || (isHorizontal ? 'center' : 'flex-start')};`;
    
    const margin = getMarginStyle(node.margin, parentLayout, node.position);
    const alignSelf = getAlignStyle(node.position !== 'absolute' ? (parentLayout === 'vertical' ? node.align : null) : null, null, parentLayout);

    let html = `<div style="display:flex; flex-direction:${currentDir}; box-sizing:border-box; ${posStyle} ${padding} ${bg} ${spacing} ${widthVal} ${height} ${corner} ${justify} ${align} ${margin} ${flexStyle} ${alignSelf}">`;
    if (node.contents) {
      node.contents.forEach(child => html += renderFlexHTML(child, node.layout));
    }
    html += '</div>';
    return html;
  }

  // D. TEXT
  if (node.type === 'text') {
    const posStyle = getPositionStyle(node);
    const color = node.color || '#000000';
    const size = getSize(node.size, 'text');
    const weight = node.weight === 'bold' ? 'font-weight:700;' : 'font-weight:400;';
    const textAlign = node.align ? `text-align:${node.align};` : ''; 
    const wrapStyle = node.wrap ? 'white-space:pre-wrap; word-break:break-word;' : 'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
    const flexStyle = getFlexStyle(node.flex, node.position);
    const margin = getMarginStyle(node.margin, parentLayout, node.position);
    const boxAlign = getAlignStyle(node.align, node.gravity, parentLayout);

    return `<div style="${posStyle} color:${color}; font-size:${size}; ${weight} ${textAlign} ${margin} ${wrapStyle} line-height:1.4; ${flexStyle} ${boxAlign}">${node.text || ''}</div>`;
  }

  // E. IMAGE & ICON
  if (node.type === 'image' || node.type === 'icon') {
    const isIcon = node.type === 'icon';
    const posStyle = getPositionStyle(node);
    const aspect = node.aspectRatio ? node.aspectRatio.replace(':', '/') : (isIcon ? '1/1' : 'auto');
    const widthVal = getSize(node.size, 'width');
    const width = (node.size === 'full' || (!isIcon && !node.size)) ? 'width:100%;' : `width:${widthVal};`;
    const fit = node.aspectMode === 'cover' ? 'object-fit:cover;' : 'object-fit:contain;';
    const height = (node.aspectMode === 'cover') ? 'height:100%;' : 'height:auto;';
    const margin = getMarginStyle(node.margin, parentLayout, node.position);
    const boxAlign = getAlignStyle(node.align, node.gravity, parentLayout);

    return `<img src="${node.url}" style="display:block; ${posStyle} ${width} ${height} aspect-ratio:${aspect}; ${fit} ${margin} ${boxAlign} vertical-align:bottom;" />`;
  }

  // F. BUTTON
  if (node.type === 'button') {
      const posStyle = getPositionStyle(node);
      const color = node.color || '#1B437C'; 
      let btnStyle = `display:flex; align-items:center; justify-content:center; width:100%; border-radius:4px; font-weight:700; cursor:pointer; text-decoration:none; box-sizing:border-box;`;
      
      if (node.style === 'primary') btnStyle += `background-color:${color}; color:#fff; border:none;`;
      else if (node.style === 'secondary') btnStyle += `background-color:transparent; color:${color}; border:1px solid ${color};`;
      else btnStyle += `background-color:transparent; color:${color}; border:none;`;
      
      const hMap = { sm:'30px', md:'40px' };
      const hVal = hMap[node.height] || '40px';
      const margin = getMarginStyle(node.margin, parentLayout, node.position);
      const boxAlign = getAlignStyle(node.align, node.gravity, parentLayout);

      return `<div style="${posStyle} width:100%; ${margin} ${boxAlign}"><a style="${btnStyle} height:${hVal};">${node.action ? (node.action.label || 'Button') : 'Button'}</a></div>`;
  }

  // G. SEPARATOR
  if (node.type === 'separator') {
      const color = node.color || '#eeeeee';
      const marginVal = node.margin ? getSpacing(node.margin) : '8px';
      const isHorizontalParent = parentLayout === 'horizontal';
      const width = isHorizontalParent ? '1px' : '100%';
      const height = isHorizontalParent ? '100%' : '1px';
      const margin = isHorizontalParent 
          ? `margin-left:${marginVal}; margin-right:0;` 
          : `margin-top:${marginVal}; margin-bottom:0;`;

      return `<div style="width:${width}; height:${height}; background-color:${color}; ${margin} flex-shrink:0;"></div>`;
  }
  
  if (node.type === 'filler') return '<div style="flex:1;"></div>';

  return '';
};