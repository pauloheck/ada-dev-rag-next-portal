import { NextRequest, NextResponse } from 'next/server';

interface Document {
  id: string;
  source: string;
  type: string;
  content_preview: string;
}

export async function GET(req: NextRequest) {
  try {
    // Get source from query parameters
    const searchParams = req.nextUrl.searchParams;
    const source = searchParams.get('source');

    // Mock data for testing - replace with actual database call
    const documents: Document[] = [
      {
        id: '1',
        source: 'C:\\Users\\paulo\\AppData\\Local\\Temp\\tmp0b6qe_e7',
        type: 'image',
        content_preview: 'Análise do Diagrama...'
      },
      {
        id: '2',
        source: 'texto_manual_1',
        type: 'texto',
        content_preview: 'Meu nome é Paulo Heck no sistema Rag'
      }
    ];

    // Filter by source if provided
    const filteredDocs = source 
      ? documents.filter(doc => doc.source.includes(source))
      : documents;

    return NextResponse.json(filteredDocs);

  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    // Mock update - replace with actual database update
    const updatedDoc = {
      id,
      source: 'updated_source',
      type: 'text',
      content_preview: 'Updated content'
    };

    return NextResponse.json(updatedDoc);

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { source } = await req.json();
    
    // Mock deletion - replace with actual database deletion
    return NextResponse.json({
      success: true,
      message: `Document ${source} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
