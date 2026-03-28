import { NextRequest, NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@/lib/aws";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching employee with ID:", id);

    const result = await dynamoClient.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_EMPLOYEES_TABLE!,
        Key: { id },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const { aadhaarNumber, panNumber, ...safeData } = result.Item;
    return NextResponse.json(safeData, { headers: corsHeaders });

  } catch (err: any) {
    console.error("GET /employee/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}