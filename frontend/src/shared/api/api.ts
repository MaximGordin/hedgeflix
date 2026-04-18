type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: number | null;
    };

export const createApiClient = (locale: string = 'en') => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  return async function request<T>(endPoint: string, options?: RequestInit): Promise<ApiResult<T>> {
    try {
      const res = await fetch(`${API_URL}${endPoint}`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600 },
        ...options,
        headers: {
          'Accept-Language': locale,
          ...options?.headers,
        },
      });
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
        };
      }
      const data = await res.json();

      return {
        ok: true,
        data: data,
      };
    } catch (error) {
      return {
        ok: false,
        status: null,
      };
    }
  };
};
