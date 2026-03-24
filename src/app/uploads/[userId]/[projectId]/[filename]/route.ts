import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string; projectId: string; filename: string }> }
) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { userId, projectId, filename } = await params

    // Only allow access to own files (admins can access all)
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Security: Prevent directory traversal
    if (
      userId.includes('..') ||
      projectId.includes('..') ||
      filename.includes('..')
    ) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      )
    }

    const filePath = path.join(
      process.cwd(),
      'uploads',
      userId,
      projectId,
      filename
    )

    // Read the file
    const fileBuffer = await readFile(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    )
  }
}
