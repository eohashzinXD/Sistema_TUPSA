import { NextResponse } from "next/server";
import path from "path";

import { auth } from "@/auth";
import { isPaiDeSanto } from "@/actions/schedules";

const MAX_SCHEDULE_IMAGE_SIZE = 4 * 1024 * 1024;
const allowedScheduleImageExtensions = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".webp"
]);
const allowedScheduleImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function getSafeScheduleImageExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (!allowedScheduleImageExtensions.has(extension)) {
    return null;
  }

  return extension;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "NÃ£o autenticado" }, { status: 401 });
  }

  const canManage = await isPaiDeSanto(session.user.id);
  if (!canManage) {
    return NextResponse.json({ error: "Sem permissÃ£o" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Selecione uma imagem para enviar" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SCHEDULE_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no mÃ¡ximo 4 MB" },
      { status: 400 }
    );
  }

  const extension = getSafeScheduleImageExtension(file.name);
  if (!extension || !allowedScheduleImageMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Use uma imagem JPG, PNG ou WEBP" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

  return NextResponse.json({
    success: "Imagem enviada",
    url: dataUrl
  });
}
