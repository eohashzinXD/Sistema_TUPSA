import { NextResponse } from "next/server";
import path from "path";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const MAX_CRONOGRAMA_IMAGE_SIZE = 4 * 1024 * 1024;
const allowedCronogramaImageExtensions = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".webp"
]);
const allowedCronogramaImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function getSafeCronogramaImageExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (!allowedCronogramaImageExtensions.has(extension)) {
    return null;
  }

  return extension;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const allowed = await hasPermission(session.user.id, "cronogramas:manage");
  if (!allowed) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Selecione uma imagem para enviar" },
      { status: 400 }
    );
  }

  if (file.size > MAX_CRONOGRAMA_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no máximo 4 MB" },
      { status: 400 }
    );
  }

  const extension = getSafeCronogramaImageExtension(file.name);
  if (!extension || !allowedCronogramaImageMimeTypes.has(file.type)) {
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
