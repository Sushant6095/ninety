export const api = (p: string, init?: RequestInit) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${p}`, init).then(r => r.json());
