import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const { employeeId, docType, fileName } = await req.json();
    const key = `documents/${employeeId}/${docType}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return NextResponse.json({ url, key });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}