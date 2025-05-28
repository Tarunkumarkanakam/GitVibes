import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api/v1';

// Config with proper timeouts
const fetchConfig = {
  // Using a short timeout to prevent the Next.js API route from hanging
  timeout: 6000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  cache: 'no-store' as RequestCache,
};

export async function GET(request: NextRequest) {
  console.log('Roast API route hit');
  const searchParams = request.nextUrl.searchParams;
  
  // Get all required parameters
  const repoName = searchParams.get('repo_name');
  const owner = searchParams.get('owner');
  const vibe = searchParams.get('vibe') || 'neutral';
  const score = searchParams.get('score') || '50';
  const stars = searchParams.get('stars') || '0';
  const issues = searchParams.get('issues') || '0';
  const lastCommitDays = searchParams.get('last_commit_days') || '0';
  
  if (!repoName || !owner) {
    return NextResponse.json(
      { error: 'Repository name and owner are required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Generating roast for ${owner}/${repoName}`);
    
    // Set up a timeout for the fetch operation with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchConfig.timeout);
    
    try {
      // Call the backend API to get a roast for the repository
      const response = await fetch(
        `${BACKEND_API_URL}/roast/generate?` + 
        `repo_name=${encodeURIComponent(repoName)}&` + 
        `owner=${encodeURIComponent(owner)}&` + 
        `vibe=${encodeURIComponent(vibe)}&` + 
        `score=${encodeURIComponent(score)}&` + 
        `stars=${encodeURIComponent(stars)}&` + 
        `issues=${encodeURIComponent(issues)}&` + 
        `last_commit_days=${encodeURIComponent(lastCommitDays)}`,
        {
          ...fetchConfig
        }
      );
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorData);
        } catch (e) {
          errorJson = { detail: errorData };
        }
        
        console.error('Backend roast API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorJson
        });
        
        // If backend is unavailable, provide a fallback roast
        if (response.status >= 500) {
          const fallbackResponse = {
            status: "success",
            roast: `This ${repoName} repo has some serious potential. Keep up the good work!`,
            ai_enhanced: false
          };
          
          return NextResponse.json(fallbackResponse);
        }
        
        return NextResponse.json(
          { error: errorJson.detail || `API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Backend roast response:', data);
      
      return NextResponse.json(data);
    } catch (fetchError: any) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId);
      
      // Handle timeout or network errors
      console.error('Fetch error during roast generation:', fetchError);
      
      // Return a friendly message for timeouts
      if (fetchError.name === 'AbortError') {
        const timeoutResponse = {
          status: "success",
          roast: `Hmm, ${repoName} is so complex it broke our roasting algorithm! (Our AI timed out, but the repo looks cool!)`,
          ai_enhanced: false
        };
        
        return NextResponse.json(timeoutResponse);
      }
      
      // Re-throw to be caught by outer try-catch
      throw fetchError;
    }
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Error in roast API:', errorMessage, error);
    
    // Return a fallback response with a helpful error message
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
