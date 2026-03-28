import { NextRequest, NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, type, location, deviceId, employeeName } = body;

    if (!employeeId || !type) {
      return NextResponse.json(
        { error: "employeeId and type are required" },
        { status: 400 }
      );
    }

    // Both partition key (employeeId) + sort key (timestamp) are required
    const timestamp = new Date().toISOString();

    await dynamoClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_PUNCHES_TABLE!,
      Item: {
        employeeId,           // ✅ partition key
        timestamp,            // ✅ sort key — unique per punch since ISO includes ms
        type,                 // "in" or "out"
        location: location || null,
        deviceId: deviceId || null,
        employeeName: employeeName || null,
      },
    }));

    return NextResponse.json({ success: true, timestamp });

  } catch (err: any) {
    console.error("POST /punch error:", err.name, err.message);
    return NextResponse.json({
      error: err.message,
      name: err.name,
      code: err.$metadata?.httpStatusCode,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    const result = await dynamoClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_PUNCHES_TABLE!,
      FilterExpression: "employeeId = :eid",
      ExpressionAttributeValues: { ":eid": employeeId },
    }));

    // Sort latest first
    const items = (result.Items || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(items);

  } catch (err: any) {
    console.error("GET /punch error:", err.message);
    return NextResponse.json({
      error: err.message,
      name: err.name,
    }, { status: 500 });
  }
}