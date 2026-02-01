import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { searchBrandLogo } from '@/utils/brandfetch';

// Mock global fetch
global.fetch = vi.fn() as Mock;

describe('searchBrandLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return logo information when brand is found via edge function', async () => {
    const mockResponse = {
      name: 'Ray-Ban',
      domain: 'ray-ban.com',
      logoUrl: 'https://example.com/logo.svg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchBrandLogo('Ray-Ban');

    expect(result).toEqual({
      name: 'Ray-Ban',
      domain: 'ray-ban.com',
      logoUrl: 'https://example.com/logo.svg',
    });
    
    // Verify it calls the edge function (not Brandfetch API directly)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as Mock).mock.calls[0] as unknown[];
    expect(fetchCall[0]).toContain('/functions/v1/fetch-brand-logo?query=Ray-Ban');
    expect((fetchCall[1] as Record<string, unknown>).method).toBe('GET');
  });

  it('should return null when brand is not found', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Brand not found' }),
    });

    const result = await searchBrandLogo('NonExistentBrand');

    expect(result).toBeNull();
  });

  it('should return logo with SVG format', async () => {
    const mockResponse = {
      name: 'Test Brand',
      domain: 'test.com',
      logoUrl: 'https://example.com/logo.svg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result?.logoUrl).toBe('https://example.com/logo.svg');
  });

  it('should return light theme logo from edge function', async () => {
    const mockResponse = {
      name: 'Test Brand',
      domain: 'test.com',
      logoUrl: 'https://example.com/light-logo.svg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result?.logoUrl).toBe('https://example.com/light-logo.svg');
  });

  it('should successfully fetch brand through edge function', async () => {
    const mockResponse = {
      name: 'Test Brand',
      domain: 'test-brand.com',
      logoUrl: 'https://example.com/logo.svg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result).toEqual({
      name: 'Test Brand',
      domain: 'test-brand.com',
      logoUrl: 'https://example.com/logo.svg',
    });
  });

  it('should return null when no logo is found', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No logo found for this brand' }),
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await searchBrandLogo('Test Brand');

    expect(result).toBeNull();
  });

  it('should return null when VITE_SUPABASE_URL is not set', async () => {
    // Save current env
    const originalEnv = import.meta.env.VITE_SUPABASE_URL;
    
    // Temporarily remove VITE_SUPABASE_URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).VITE_SUPABASE_URL = undefined;

    const result = await searchBrandLogo('Test Brand');

    expect(result).toBeNull();
    
    // Restore env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).VITE_SUPABASE_URL = originalEnv;
  });

  it('should call edge function with correct URL encoding', async () => {
    const mockResponse = {
      name: 'JUST CAVALLI',
      domain: 'justcavalli.com',
      logoUrl: 'https://example.com/logo.svg',
    };

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await searchBrandLogo('JUST CAVALLI');

    // Verify the query is properly URL encoded
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as Mock).mock.calls[0] as unknown[];
    expect(fetchCall[0]).toContain('/functions/v1/fetch-brand-logo?query=JUST%20CAVALLI');
    expect(fetchCall[1]).toEqual({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});
