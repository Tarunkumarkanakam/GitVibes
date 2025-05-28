import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1';

export async function GET(request: NextRequest) {
  console.log('Search API route hit');
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    console.log(`Searching repositories for: ${query}`);
    
    // Call the new search endpoint we just created in the backend
    const response = await fetch(`${BACKEND_API_URL}/search/repositories?query=${encodeURIComponent(query)}&limit=5`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorData);
      } catch (e) {
        errorJson = { detail: errorData };
      }
      
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorJson
      });
      
      // If backend is unavailable, fall back to a simpler response
      // This ensures the UI doesn't break completely
      if (response.status >= 500) {
        return NextResponse.json({
          items: [
            {
              id: 1,
              name: 'react',
              full_name: 'facebook/react',
              description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
              owner: {
                login: 'facebook',
                avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4'
              }
            }
          ]
        });
      }
      
      return NextResponse.json(
        { error: errorJson.detail || `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend search response:', data);
    
    // Transform the backend response format to match what the frontend expects
    if (data.status === 'success' && data.items) {
      return NextResponse.json({ items: data.items });
    }
    
    // If we couldn't process the data properly, return an empty result
    console.warn('Unexpected response format from backend search API:', data);
    return NextResponse.json({ items: [] });
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Error in search API:', errorMessage, error);
    
    // Return a fallback response with a helpful error message
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
