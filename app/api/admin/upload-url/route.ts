import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const { employeeId, docType, fileName, contentType } = await req.json();
    const key = `documents/${employeeId}/${docType}-${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return NextResponse.json({ url, key });

  } catch (err: any) {
    console.error("upload-url error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}