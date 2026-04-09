import { NextRequest, NextResponse } from "next/server";
import { getTripWithViewer } from "@/lib/app-service";
import { createId } from "@/lib/utils";

// 使用内存存储照片（生产环境应该使用云存储）
const taskPhotos = new Map<string, string[]>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  try {
    const { tripId, taskId } = await params;
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
    }

    // 验证文件大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
    }

    // 读取文件并转换为 base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const photoUrl = `data:${file.type};base64,${base64}`;

    // 获取该任务的现有照片
    const existingPhotos = taskPhotos.get(taskId) || [];
    existingPhotos.push(photoUrl);
    taskPhotos.set(taskId, existingPhotos);

    return NextResponse.json({
      success: true,
      photoUrl,
      photos: existingPhotos,
    });
  } catch (error) {
    console.error("上传照片失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  const { taskId } = await params;
  const photos = taskPhotos.get(taskId) || [];
  return NextResponse.json({ photos });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { photoUrl } = body;

    const existingPhotos = taskPhotos.get(taskId) || [];
    const updatedPhotos = existingPhotos.filter((url) => url !== photoUrl);
    taskPhotos.set(taskId, updatedPhotos);

    return NextResponse.json({
      success: true,
      photos: updatedPhotos,
    });
  } catch (error) {
    console.error("删除照片失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
