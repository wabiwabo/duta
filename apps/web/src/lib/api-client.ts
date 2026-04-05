import Axios, { type AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Token will be set by the auth provider after login
let getAccessToken: (() => Promise<string>) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

AXIOS_INSTANCE.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed, proceed without auth
    }
  }
  return config;
});

export const apiClient = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error -- Orval expects cancel property on promise
  promise.cancel = () => source.cancel('Query was cancelled');

  return promise;
};

export default apiClient;
