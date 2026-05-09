import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import path from "path";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { getPostHogClient } from "@/lib/posthog-server";

const MAX_STUDY_FILE_SIZE = 10 * 1024 * 1024;
const STUDY_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "studies");
const STUDY_UPLOAD_PUBLIC_PATH = "/uploads/studies";
const STUDY_BLOB_PREFIX = "studies";
const allowedStudyFileExtensions = new Set([
  ".doc",
  ".docx",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".txt",
  ".webp",
  ".xls",
  ".xlsx"
]);

function getSafeStudyFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (!allowedStudyFileExtensions.has(extension)) {
    return null;
  }

  return extension;
}

async function uploadStudyFile(file: File, fileName: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${STUDY_BLOB_PREFIX}/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false
    });

    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("BLOB_READ_WRITE_TOKEN_NOT_CONFIGURED");
  }

  await mkdir(STUDY_UPLOAD_DIR, { recursive: true });

  const filePath = path.join(STUDY_UPLOAD_DIR, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, bytes);

  return `${STUDY_UPLOAD_PUBLIC_PATH}/${fileName}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [canCreate, canUpdate] = await Promise.all([
    hasPermission(session.user.id, "study:create"),
    hasPermission(session.user.id, "study:update")
  ]);

  if (!canCreate && !canUpdate) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Selecione um arquivo para enviar" },
      { status: 400 }
    );
  }

  if (file.size > MAX_STUDY_FILE_SIZE) {
    return NextResponse.json(
      { error: "O arquivo deve ter no máximo 10 MB" },
      { status: 400 }
    );
  }

  const extension = getSafeStudyFileExtension(file.name);
  if (!extension) {
    return NextResponse.json(
      { error: "Formato de arquivo não permitido" },
      { status: 400 }
    );
  }

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  let fileUrl: string;

  try {
    fileUrl = await uploadStudyFile(file, fileName);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "BLOB_READ_WRITE_TOKEN_NOT_CONFIGURED"
    ) {
      return NextResponse.json(
        { error: "Storage de arquivos não configurado no ambiente" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível enviar o arquivo" },
      { status: 500 }
    );
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: session.user.id,
    event: "study_file_uploaded",
    properties: {
      file_extension: extension,
      file_size_bytes: file.size
    }
  });
  await posthog.shutdown();

  return NextResponse.json({
    success: "Arquivo enviado",
    url: fileUrl
  });
}
