import { parse } from 'url';
import { MediaMetadataService } from 'services/types';
import { YouTubeMetadataService } from 'services/youtube';
import { WebMetadataService } from 'services/web';

const services: MediaMetadataService[] = [new YouTubeMetadataService(), new WebMetadataService()];

export const getServiceForUrl = (href: string): MediaMetadataService | null => {
  const url = parse(href);
  return services.find(svc => svc.match(url)) || null;
};
