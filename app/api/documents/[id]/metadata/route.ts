import { NextRequest, NextResponse } from 'next/server';

interface MetadataUpdate {
  description?: string;
  tags?: string[];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const metadata: MetadataUpdate = await req.json();

    // Mock update - replace with actual database update
    const updatedDoc = {
      id,
      source: 'document_source',
      type: 'text',
      content_preview: metadata.description || 'Updated content',
      tags: metadata.tags || []
    };

    return NextResponse.json(updatedDoc);

  } catch (error) {
    console.error('Error updating document metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update document metadata' },
      { status: 500 }
    );
  }
}
