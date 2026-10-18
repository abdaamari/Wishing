export type BrandingConfig = {
  brandName: string;
  logoUrl: string | null;
  musicEnabled: boolean;
};

export const DEFAULT_BRANDING: BrandingConfig = {
  brandName: 'Wishing Wall',
  logoUrl: null,
  musicEnabled: false,
};
