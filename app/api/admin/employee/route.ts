import { NextRequest, NextResponse } from "next/server";
import { PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@/lib/aws";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "add") {
      const id = randomUUID();
      await dynamoClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Item: {
          id,
          status: "active",
          ...data,
          createdAt: new Date().toISOString(),
        },
      }));
      return NextResponse.json({ id });
    }

    if (action === "toggleStatus") {
      await dynamoClient.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Key: { id: data.id },
        UpdateExpression: "SET #s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": data.status },
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "list") {
      const result = await dynamoClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
      }));
      return NextResponse.json(result.Items || []);
    }

    if (action === "delete") {
      await dynamoClient.send(new DeleteCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Key: { id: data.id },
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const { id, ...fields } = data;
      const entries = Object.entries(fields);
      const UpdateExpression = "SET " + entries.map((_, i) => `#k${i} = :v${i}`).join(", ");
      const ExpressionAttributeNames = Object.fromEntries(entries.map(([k], i) => [`#k${i}`, k]));
      const ExpressionAttributeValues = Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v]));
      await dynamoClient.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Key: { id },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      }));
      return NextResponse.json({ success: true });
    }

    // ✅ NEW: save doc/photo URLs back to DynamoDB after S3 upload
    if (action === "updateDocs") {
      const { id, docType, url } = data;
      // Map docType to DynamoDB field name
      const fieldMap: Record<string, string> = {
        profilePhoto: "profilePhotoUrl",
        aadhaar: "aadhaarUrl",
        pan: "panUrl",
        contract: "contractUrl",
      };
      const field = fieldMap[docType];
      if (!field) return NextResponse.json({ error: "Invalid docType" }, { status: 400 });

      await dynamoClient.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Key: { id },
        UpdateExpression: "SET #f = :u",
        ExpressionAttributeNames: { "#f": field },
        ExpressionAttributeValues: { ":u": url },
      }));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}