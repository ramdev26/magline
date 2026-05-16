export type ApiRequest = { method?: string; body?: Record<string, unknown> };
export type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};
