export type Wish = {
  id: string;
  name: string;
  message: string;
  photo_url: string | null;
  color: string;
  is_anonymous: boolean;
  status: 'published' | 'hidden';
  created_at: string;
};

export type WishInput = {
  name?: string;
  message: string;
  color: string;
  is_anonymous?: boolean;
};
