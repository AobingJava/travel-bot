import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// 使用内存存储语音（生产环境应该使用云存储）
const taskVoices = new Map<string, { url: string; createdAt: string; duration?: number; userEmail: string; userName: string; userAvatarUrl?: string; transcript?: string }[]>();

// 简单的语音转文字模拟（生产环境应该使用 Whisper 等 API）
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  // 这里可以调用 OpenAI Whisper API 或其他语音识别服务
  // 暂时返回占位文本
  return "语音内容已记录";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  try {
    const { tripId, taskId } = await params;
    const formData = await request.formData();
    const file = formData.get("voice") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    // 获取当前用户信息
    const user = await getSessionUser();
    const userEmail = user?.email || "unknown@example.com";
    const userName = user?.name || "未知用户";

    // 验证文件类型
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "请上传音频文件" }, { status: 400 });
    }

    // 验证文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "音频大小不能超过 10MB" }, { status: 400 });
    }

    // 读取文件并转换为 base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const voiceUrl = `data:${file.type};base64,${base64}`;

    // 语音转文字
    const transcript = await transcribeAudio(buffer);

    // 获取该任务的现有语音
    const existingVoices = taskVoices.get(taskId) || [];
    existingVoices.push({
      url: voiceUrl,
      createdAt: new Date().toISOString(),
      duration: 0,
      userEmail,
      userName,
      userAvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      transcript,
    });
    taskVoices.set(taskId, existingVoices);

    return NextResponse.json({
      success: true,
      voiceUrl,
      voices: existingVoices,
    });
  } catch (error) {
    console.error("上传语音失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  const { taskId } = await params;
  const voices = taskVoices.get(taskId) || [];
  return NextResponse.json({ voices });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { voiceUrl } = body;

    const existingVoices = taskVoices.get(taskId) || [];
    const updatedVoices = existingVoices.filter((v) => v.url !== voiceUrl);
    taskVoices.set(taskId, updatedVoices);

    return NextResponse.json({
      success: true,
      voices: updatedVoices,
    });
  } catch (error) {
    console.error("删除语音失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
