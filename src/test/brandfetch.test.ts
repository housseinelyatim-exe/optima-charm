import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchBrandLogo } from '@/utils/brandfetch';

// Mock global fetch
global.fetch = vi.fn();

describe('searchBrandLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return logo information when brand is found via direct domain fetch', async () => {
    const mockBrandData = {
      name: 'Ray-Ban',
      domain: 'ray-ban.com',
      logos: [
        {
          type: 'logo',
          theme: 'light',
          formats: [
            { src: 'https://example.com/logo.svg', format: 'svg' }
          ]
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrandData,
    });

    const result = await searchBrandLogo('Ray-Ban');

    expect(result).toEqual({
      name: 'Ray-Ban',
      domain: 'ray-ban.com',
      logoUrl: 'https://example.com/logo.svg',
    });
  });

  it('should return null when brand is not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const result = await searchBrandLogo('NonExistentBrand');

    expect(result).toBeNull();
  });

  it('should prefer SVG format over PNG', async () => {
    const mockBrandData = {
      name: 'Test Brand',
      domain: 'test.com',
      logos: [
        {
          type: 'logo',
          theme: 'light',
          formats: [
            { src: 'https://example.com/logo.png', format: 'png' },
            { src: 'https://example.com/logo.svg', format: 'svg' }
          ]
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrandData,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result?.logoUrl).toBe('https://example.com/logo.svg');
  });

  it('should prefer light theme logo', async () => {
    const mockBrandData = {
      name: 'Test Brand',
      domain: 'test.com',
      logos: [
        {
          type: 'logo',
          theme: 'dark',
          formats: [
            { src: 'https://example.com/dark-logo.svg', format: 'svg' }
          ]
        },
        {
          type: 'logo',
          theme: 'light',
          formats: [
            { src: 'https://example.com/light-logo.svg', format: 'svg' }
          ]
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrandData,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result?.logoUrl).toBe('https://example.com/light-logo.svg');
  });

  it('should handle search fallback when direct domain fetch fails', async () => {
    const mockSearchData = [
      { domain: 'test-brand.com' }
    ];

    const mockBrandData = {
      name: 'Test Brand',
      domain: 'test-brand.com',
      logos: [
        {
          type: 'logo',
          theme: 'light',
          formats: [
            { src: 'https://example.com/logo.svg', format: 'svg' }
          ]
        }
      ]
    };

    // First call: direct domain fetch fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // Second call: search succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchData,
    });

    // Third call: brand details fetch succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrandData,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result).toEqual({
      name: 'Test Brand',
      domain: 'test-brand.com',
      logoUrl: 'https://example.com/logo.svg',
    });
  });

  it('should return null when logos array is empty', async () => {
    const mockBrandData = {
      name: 'Test Brand',
      domain: 'test.com',
      logos: []
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBrandData,
    });

    const result = await searchBrandLogo('Test Brand');

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await searchBrandLogo('Test Brand');

    expect(result).toBeNull();
  });
});
