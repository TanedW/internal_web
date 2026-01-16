export function getRichMenuTemplate(menuName) {
  return {
    size: {
      width: 2500,
      height: 843,
    },
    selected: true,
    name: menuName,
    chatBarText: 'เมนูหลัก',
    areas: [
      {
        bounds: {
          x: 1735,
          y: 0,
          width: 765,
          height: 230,
        },
        action: {
          type: 'message',
          text: 'เข้าสู่เมนู แจ้งเรื่องร้องทุกข์ผู้บริโภค',
        },
      },
      {
        bounds: {
          x: 0,
          y: 230,
          width: 500,
          height: 613,
        },
        action: {
          type: 'message',
          text: 'บริการอื่นๆและข่าวสาร',
        },
      },
      {
        bounds: {
          x: 500,
          y: 230,
          width: 500,
          height: 613,
        },
        action: {
          type: 'message',
          text: 'ผู้ใช้ใหม่',
        },
      },
      {
        bounds: {
          x: 1000,
          y: 230,
          width: 500,
          height: 613,
        },
        action: {
          type: 'message',
          text: 'แจ้ง ป้ายหาเสียงเกะกะ',
        },
      },
      {
        bounds: {
          x: 1500,
          y: 230,
          width: 500,
          height: 613,
        },
        action: {
          type: 'message',
          text: 'ดูเรื่องแจ้ง',
        },
      },
      {
        bounds: {
          x: 2000,
          y: 230,
          width: 500,
          height: 613,
        },
        action: {
          type: 'message',
          text: 'เรื่องแจ้งใหม่',
        },
      },
    ],
  };
}

export function getCustomRichMenuTemplate(menuName, areas = []) {
  return {
    size: {
      width: 2500,
      height: 843,
    },
    selected: true,
    name: menuName,
    chatBarText: 'เมนูหลัก',
    areas: areas.length > 0 ? areas : getRichMenuTemplate(menuName).areas,
  };
}

export function validateRichMenu(menuData) {
  const errors = [];

  if (!menuData.name || typeof menuData.name !== 'string') {
    errors.push('Menu name is required');
  }

  if (!menuData.size || !menuData.size.width || !menuData.size.height) {
    errors.push('Menu size is invalid');
  }

  if (!Array.isArray(menuData.areas) || menuData.areas.length === 0) {
    errors.push('Menu must have at least one area');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
