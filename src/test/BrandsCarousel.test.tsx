import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandsCarousel } from '@/components/home/BrandsCarousel';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', name: 'Ray-Ban', logo_url: 'https://example.com/logo1.png', display_order: 1 },
              { id: '2', name: 'Oakley', logo_url: 'https://example.com/logo2.png', display_order: 2 },
            ],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('BrandsCarousel', () => {
  it('renders the brands carousel section', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrandsCarousel />
      </QueryClientProvider>
    );

    // Check if the title is rendered
    expect(await screen.findByText('Nos Marques Partenaires')).toBeDefined();
  });

  it('renders brand images when data is loaded', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrandsCarousel />
      </QueryClientProvider>
    );

    // Wait for brands to load and check for brand names in alt text
    const rayBanImages = await screen.findAllByAltText('Ray-Ban');
    expect(rayBanImages.length).toBeGreaterThan(0);
  });
});
