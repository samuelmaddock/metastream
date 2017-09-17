import { Url } from 'url';
import { MediaMetadataService } from 'services/types';
import { YouTubeMetadataService } from 'services/youtube';
import { WebMetadataService } from 'services/web';

const services: MediaMetadataService[] = [new YouTubeMetadataService(), new WebMetadataService()];

export const getServiceForUrl = (url: Url): MediaMetadataService | null => {
  return services.find(svc => svc.match(url)) || null;
};
