import { callLineAPI } from '@/lib/lineApi';
import { getBotToken } from '@/lib/botConfig';
import { getRichMenuTemplate } from '@/lib/richMenuTemplate';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const botKey = formData.get('botKey');
    const menuName = formData.get('menuName');
    const chatBarText = formData.get('chatBarText') || 'เมนูหลัก';
    const menuImage = formData.get('menuImage');
    
    // ✅ รับค่า JSON string ของ areas ที่ส่งมาจากหน้าเว็บ
    const areasString = formData.get('areas'); 
    const areas = JSON.parse(areasString);

    // ✅ สร้าง Object โครงสร้างตาม Format ของ LINE ตรงนี้เลย
    const richMenuData = {
      size: { width: 2500, height: 843 }, // หรือปรับตามขนาดภาพ
      selected: true,
      name: menuName,
      chatBarText: chatBarText,
      areas: areas // ใช้ค่าที่ส่งมาจากหน้าเว็บ
    };

    if (step1.code !== 200 || !step1.response?.richMenuId) {
      return Response.json(
        {
          error: 'Failed to create menu structure',
          details: step1.response?.message || step1.raw,
        },
        { status: 400 }
      );
    }

    const richMenuId = step1.response.richMenuId;

    const imageBuffer = Buffer.from(await menuImage.arrayBuffer());
    const step2 = await callLineAPI(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      'POST',
      imageBuffer,
      token,
      true
    );

    if (step2.code !== 200) {
      await callLineAPI(
        `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
        'DELETE',
        null,
        token
      );

      return Response.json(
        {
          error: 'Failed to upload image',
          details: step2.response?.message || step2.raw,
        },
        { status: 400 }
      );
    }

    await callLineAPI(
      `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
      'POST',
      {},
      token
    );

    return Response.json({
      success: true,
      richMenuId,
      message: `Menu "${menuName}" created successfully`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
