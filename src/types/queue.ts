export interface QueueItem {
  id?: string;
  name: string;
  nameSearch: string;
  song: string;
  band?: string;
  alreadySang: boolean;
  visitDate: string;
  link?: string | null;
  addedAt: Date;
  userId?: string;
}
