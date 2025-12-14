import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string; projectId: string; filename: string }> }
) {
  try {
    const { userId, projectId, filename } = await params

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
