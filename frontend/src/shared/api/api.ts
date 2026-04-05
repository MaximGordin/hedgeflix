export const createApiClient = (locale: string = 'en') => {
  // @TODO Вынести в .env. Возможно есть способ получить данные из .env бэкэнда или вынести в общий root.
  const API_HOST = 'http://localhost';
  const API_BASE_PATH = 'api';
  const API_PORT = 3001;
  const API_URL = `${API_HOST}:${API_PORT}/${API_BASE_PATH}`;

  return async (endPoint: string, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${endPoint}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
      ...options,
      headers: {
        'Accept-Language': locale,
        ...options?.headers,
      },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };
};
