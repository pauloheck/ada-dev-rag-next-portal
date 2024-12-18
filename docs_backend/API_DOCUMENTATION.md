# RAG System API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, the API is open and uses CORS to allow all origins. Authentication will be implemented in future versions.

## API Endpoints

### Query Operations

#### Query Documents
```http
POST /query
```

**Request Body:**
```json
{
    "question": "string"
}
```

**Response:**
```json
{
    "answer": "string",
    "sources": [
        {
            "source": "string",
            "type": "string"
        }
    ]
}
```

**Error Responses:**
- `400 Bad Request`: Empty question
- `500 Internal Server Error`: Processing error

### Document Management

#### Add Text Document
```http
POST /documents/text
```

**Request Body:**
```json
{
    "content": "string",
    "metadata": {
        "source": "string",
        "type": "string"
    }
}
```

**Response:**
```json
{
    "success": true,
    "document_id": "string"
}
```

#### List Documents
```http
GET /documents
```

**Query Parameters:**
- `source` (optional): Filter by source

**Response:**
```json
{
    "documents": [
        {
            "id": "string",
            "source": "string",
            "type": "string",
            "content_preview": "string"
        }
    ]
}
```

#### Remove Document
```http
DELETE /documents/{source}
```

**Response:**
```json
{
    "success": true,
    "message": "string"
}
```

### Image Processing

#### Upload Single Image
```http
POST /upload
```

**Request Body:**
- Form data with file

**Response:**
```json
{
    "success": true,
    "image_id": "string",
    "analysis": {
        "description": "string",
        "tags": ["string"],
        "confidence": number
    }
}
```

#### Process Image Batch
```http
POST /batch
```

**Request Body:**
- Form data with multiple files

**Response:**
```json
{
    "success": true,
    "results": [
        {
            "image_id": "string",
            "analysis": {
                "description": "string",
                "tags": ["string"],
                "confidence": number
            }
        }
    ]
}
```

#### Clear Image Cache
```http
POST /cache/clear
```

**Query Parameters:**
- `older_than` (optional): Clear cache older than X seconds

**Response:**
```json
{
    "success": true,
    "cleared_items": number
}
```

### Chat Interface

#### Send Chat Message
```http
POST /chat
```

**Request Body:**
```json
{
    "message": "string",
    "context": {
        "conversation_id": "string",
        "user_id": "string"
    }
}
```

**Response:**
```json
{
    "response": "string",
    "sources": [
        {
            "source": "string",
            "relevance": number
        }
    ],
    "conversation_id": "string"
}
```

#### Get Chat History
```http
GET /chat/history
```

**Query Parameters:**
- `conversation_id` (optional): Specific conversation history

**Response:**
```json
{
    "messages": [
        {
            "role": "string",
            "content": "string",
            "timestamp": "string"
        }
    ]
}
```

#### Clear Chat History
```http
POST /chat/clear
```

**Response:**
```json
{
    "success": true,
    "message": "string"
}
```

### System Statistics

#### Get Basic Stats
```http
GET /stats
```

**Response:**
```json
{
    "document_count": number,
    "image_count": number,
    "total_tokens": number,
    "last_updated": "string"
}
```

#### Get Detailed Stats
```http
GET /stats/detailed
```

**Response:**
```json
{
    "documents": {
        "total": number,
        "by_type": {
            "text": number,
            "image": number
        }
    },
    "processing": {
        "average_query_time": number,
        "cache_hit_rate": number
    },
    "storage": {
        "total_size": number,
        "by_type": {
            "text": number,
            "image": number
        }
    }
}
```

## Error Handling

### Error Response Format
```json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {}
    }
}
```

### Common Error Codes
- `400`: Bad Request
- `404`: Not Found
- `413`: Payload Too Large
- `415`: Unsupported Media Type
- `429`: Too Many Requests
- `500`: Internal Server Error

## Best Practices

### Rate Limiting
While currently not implemented, clients should prepare for rate limiting in future versions:
- Implement exponential backoff
- Cache responses where appropriate
- Batch requests when possible

### Performance Optimization
1. **Batch Processing**
   - Use batch endpoints for multiple items
   - Implement client-side caching
   - Handle pagination properly

2. **Error Handling**
   - Implement proper retry logic
   - Handle timeouts gracefully
   - Log errors appropriately

3. **Resource Management**
   - Clean up unused resources
   - Monitor memory usage
   - Implement proper cleanup

## Integration Examples

### Python Example
```python
import requests

def query_rag(question):
    response = requests.post(
        "http://localhost:8000/query",
        json={"question": question}
    )
    return response.json()

def upload_image(image_path):
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            "http://localhost:8000/upload",
            files=files
        )
    return response.json()
```

### JavaScript Example
```javascript
async function queryRag(question) {
    const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
    });
    return await response.json();
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
    });
    return await response.json();
}
```
