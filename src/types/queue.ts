export interface QueueItem {
    id?: string;
    name: string;
    nameSearch: string;
    song: string;
    band?: string;
    alreadySang: boolean;
    visitDate: string;
    onStage?: boolean;
    link?: string | null;
    addedAt: Date;
    restaurantId: string;
}
