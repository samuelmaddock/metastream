import { MediaMetadataService } from 'services/types';
import { YouTubeMetadataService } from 'services/youtube';

const services: MediaMetadataService[] = [new YouTubeMetadataService()];

export const getServiceForUrl = (url: string): MediaMetadataService | null => {
  return services.find(svc => svc.match(url)) || null;
};
