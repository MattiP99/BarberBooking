import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL with query parameters if provided
    let url = queryKey[0] as string;
    
    // If there are additional parameters in the queryKey, add them as query params
    if (queryKey.length > 1 && typeof queryKey[0] === 'string') {
      const params = new URLSearchParams();
      
      // Process the rest of queryKey elements as URL parameters
      for (let i = 1; i < queryKey.length; i += 2) {
        if (i + 1 < queryKey.length && queryKey[i] !== undefined && queryKey[i+1] !== undefined) {
          params.append(queryKey[i] as string, queryKey[i+1]?.toString() || '');
        }
      }
      
      const paramString = params.toString();
      if (paramString) {
        url += (url.includes('?') ? '&' : '?') + paramString;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
