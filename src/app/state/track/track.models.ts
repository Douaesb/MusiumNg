export interface Track {
  id?: number; 
  title: string; 
  artist: string;
  description?: string; 
  duration: number; 
  category: string; 
  createdAt: Date; 
  audioFileId?: number;
  imageFileId?: number;
  imageUrl?: string;
}
