import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { CONFIG } from "./constants";

export function shouldTryNextApiBaseUrl(error: unknown): boolean {
  const axiosErr = error as AxiosError;
  return !axiosErr.response;
}

export async function requestWithApiFallback<T>(
  path: string,
  config: AxiosRequestConfig,
  shouldTryNext = shouldTryNextApiBaseUrl
): Promise<{ baseUrl: string; response: AxiosResponse<T> }> {
  let lastError: unknown;

  for (const baseUrl of CONFIG.API_BASE_URLS) {
    try {
      const response = await axios.request<T>({
        ...config,
        url: `${baseUrl}${path}`,
      });

      return { baseUrl, response };
    } catch (error) {
      lastError = error;
      if (!shouldTryNext(error)) break;
    }
  }

  throw lastError;
}
