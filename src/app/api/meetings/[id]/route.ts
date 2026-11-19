import { NextResponse } from "next/server";
import { MeetingRepository } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const meeting = MeetingRepository.getById(params.id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    MeetingRepository.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
