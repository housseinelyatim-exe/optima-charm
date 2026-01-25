import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Settings {
  hero_tagline: string;
  hero_subtitle: string;
  shop_phone: string;
  shop_email: string;
  shop_address: string;
  facebook_url: string;
  instagram_url: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");

      if (error) throw error;

      const settings: Record<string, string> = {};
      data.forEach((row) => {
        settings[row.key] = row.value || "";
      });

      return settings as unknown as Settings;
    },
  });
}
