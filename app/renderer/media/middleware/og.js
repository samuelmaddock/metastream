import { load } from 'cheerio';
import _ from 'lodash';

const fieldsArray = [
  {
    multiple: false,
    property: 'og:title',
    fieldName: 'ogTitle'
  },
  {
    multiple: false,
    property: 'og:type',
    fieldName: 'ogType'
  },
  {
    multiple: true,
    property: 'og:image',
    fieldName: 'ogImage'
  },
  {
    multiple: true,
    property: 'og:image:url',
    fieldName: 'ogImageURL'
  },
  {
    multiple: true,
    property: 'og:image:secure_url',
    fieldName: 'ogImageSecureURL'
  },
  {
    multiple: true,
    property: 'og:image:width',
    fieldName: 'ogImageWidth'
  },
  {
    multiple: true,
    property: 'og:image:height',
    fieldName: 'ogImageHeight'
  },
  {
    multiple: true,
    property: 'og:image:type',
    fieldName: 'ogImageType'
  },
  {
    multiple: false,
    property: 'og:url',
    fieldName: 'ogUrl'
  },
  {
    multiple: false,
    property: 'og:audio',
    fieldName: 'ogAudio'
  },
  {
    multiple: false,
    property: 'og:audio:url',
    fieldName: 'ogAudioURL'
  },
  {
    multiple: false,
    property: 'og:audio:secure_url',
    fieldName: 'ogAudioSecureURL'
  },
  {
    multiple: false,
    property: 'og:audio:type',
    fieldName: 'ogAudioType'
  },
  {
    multiple: false,
    property: 'og:description',
    fieldName: 'ogDescription'
  },
  {
    multiple: false,
    property: 'og:determiner',
    fieldName: 'ogDeterminer'
  },
  {
    multiple: false,
    property: 'og:locale',
    fieldName: 'ogLocale'
  },
  {
    multiple: false,
    property: 'og:locale:alternate',
    fieldName: 'ogLocaleAlternate'
  },
  {
    multiple: false,
    property: 'og:site_name',
    fieldName: 'ogSiteName'
  },
  {
    multiple: true,
    property: 'og:video',
    fieldName: 'ogVideo'
  },
  {
    multiple: true,
    property: 'og:video:url', // An alternative to 'og:video'
    fieldName: 'ogVideo'
  },
  {
    multiple: true,
    property: 'og:video:secure_url',
    fieldName: 'ogVideoSecureURL'
  },
  {
    multiple: true,
    property: 'og:video:width',
    fieldName: 'ogVideoWidth'
  },
  {
    multiple: true,
    property: 'og:video:height',
    fieldName: 'ogVideoHeight'
  },
  {
    multiple: true,
    property: 'og:video:type',
    fieldName: 'ogVideoType'
  },
  {
    multiple: true,
    property: 'video:duration',
    fieldName: 'ogVideoDuration'
  },
  {
    multiple: false,
    property: 'twitter:card',
    fieldName: 'twitterCard'
  },
  {
    multiple: false,
    property: 'twitter:site',
    fieldName: 'twitterSite'
  },
  {
    multiple: false,
    property: 'twitter:site:id',
    fieldName: 'twitterSiteId'
  },
  {
    multiple: false,
    property: 'twitter:creator',
    fieldName: 'twitterCreator'
  },
  {
    multiple: false,
    property: 'twitter:creator:id',
    fieldName: 'twitterCreatorId'
  },
  {
    multiple: false,
    property: 'twitter:title',
    fieldName: 'twitterTitle'
  },
  {
    multiple: false,
    property: 'twitter:description',
    fieldName: 'twitterDescription'
  },
  {
    multiple: true,
    property: 'twitter:image',
    fieldName: 'twitterImage'
  },
  {
    multiple: true,
    property: 'twitter:image:height',
    fieldName: 'twitterImageHeight'
  },
  {
    multiple: true,
    property: 'twitter:image:width',
    fieldName: 'twitterImageWidth'
  },
  {
    multiple: true,
    property: 'twitter:image:src',
    fieldName: 'twitterImageSrc'
  },
  {
    multiple: true,
    property: 'twitter:image:alt',
    fieldName: 'twitterImageAlt'
  },
  {
    multiple: true,
    property: 'twitter:player',
    fieldName: 'twitterPlayer'
  },
  {
    multiple: true,
    property: 'twitter:player:width',
    fieldName: 'twitterPlayerWidth'
  },
  {
    multiple: true,
    property: 'twitter:player:height',
    fieldName: 'twitterPlayerHeight'
  },
  {
    multiple: true,
    property: 'twitter:player:stream',
    fieldName: 'twitterPlayerStream'
  },
  {
    multiple: false,
    property: 'twitter:app:name:iphone',
    fieldName: 'twitterAppNameiPhone'
  },
  {
    multiple: false,
    property: 'twitter:app:id:iphone',
    fieldName: 'twitterAppIdiPhone'
  },
  {
    multiple: false,
    property: 'twitter:app:url:iphone',
    fieldName: 'twitterAppUrliPhone'
  },
  {
    multiple: false,
    property: 'twitter:app:name:ipad',
    fieldName: 'twitterAppNameiPad'
  },
  {
    multiple: false,
    property: 'twitter:app:id:ipad',
    fieldName: 'twitterAppIdiPad'
  },
  {
    multiple: false,
    property: 'twitter:app:url:ipad',
    fieldName: 'twitterAppUrliPad'
  },
  {
    multiple: false,
    property: 'twitter:app:name:googleplay',
    fieldName: 'twitterAppNameGooglePlay'
  },
  {
    multiple: false,
    property: 'twitter:app:id:googleplay',
    fieldName: 'twitterAppIdGooglePlay'
  },
  {
    multiple: false,
    property: 'twitter:app:url:googleplay',
    fieldName: 'twitterAppUrlGooglePlay'
  }
];

var parseNumbers = function(str) {
  if (!isNaN(str)) {
    str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
  }
  return str;
};

var mediaMapperTwitterImage = function(item) {
  return {
    url: item[0],
    width: item[1],
    height: item[2],
    alt: item[3]
  };
};

var mediaMapperTwitterPlayer = function(item) {
  return {
    url: item[0],
    width: item[1],
    height: item[2],
    stream: item[3]
  };
};

var mediaMapper = function(item) {
  return {
    url: item[0],
    width: item[1],
    height: item[2],
    type: item[3],
    duration: parseNumbers(item[4])
  };
};

var mediaSorter = function(a, b) {
  if (!(a.url && b.url)) {
    return 0;
  }

  var aRes = a.url.match(/\.(\w{2,5})$/),
    aExt = (aRes && aRes[1].toLowerCase()) || null;
  var bRes = b.url.match(/\.(\w{2,5})$/),
    bExt = (bRes && bRes[1].toLowerCase()) || null;

  if (aExt === 'gif' && bExt !== 'gif') {
    return -1;
  } else if (aExt !== 'gif' && bExt === 'gif') {
    return 1;
  } else {
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  }
};

/*
* getOG - scrape that url!
* @param string url - the url we want to scrape
* @param function callback
*/
export function parse(body, options) {
  const ogImageFallback = options.ogImageFallback === undefined ? true : options.ogImageFallback;

  let $ = load(body),
    meta = $('meta'),
    keys = Object.keys(meta);

  let ogObject = {};

  keys.forEach(function(key) {
    if (!(meta[key].attribs && (meta[key].attribs.property || meta[key].attribs.name))) {
      return;
    }
    var property = meta[key].attribs.property || meta[key].attribs.name,
      content = meta[key].attribs.content;
    fieldsArray.forEach(function(item) {
      if (property === item.property) {
        if (!item.multiple) {
          ogObject[item.fieldName] = content;
        } else if (!ogObject[item.fieldName]) {
          ogObject[item.fieldName] = [content];
        } else if (Array.isArray(ogObject[item.fieldName])) {
          ogObject[item.fieldName].push(content);
        }
      }
    });
  });

  // set the ogImage or fallback to ogImageURL or ogImageSecureURL
  ogObject.ogImage = ogObject.ogImage
    ? ogObject.ogImage
    : ogObject.ogImageURL
      ? ogObject.ogImageURL
      : ogObject.ogImageSecureURL ? ogObject.ogImageSecureURL : [];
  if (!ogObject.ogImage || !ogObject.ogImage.length) {
    delete ogObject['ogImage'];
  }

  /* Combine image/width/height/type
      and sort for priority */
  if (
    ogObject.ogImage ||
    ogObject.ogImageWidth ||
    ogObject.twitterImageHeight ||
    ogObject.ogImageType
  ) {
    ogObject.ogImage = ogObject.ogImage ? ogObject.ogImage : [null];
    ogObject.ogImageWidth = ogObject.ogImageWidth ? ogObject.ogImageWidth : [null];
    ogObject.ogImageHeight = ogObject.ogImageHeight ? ogObject.ogImageHeight : [null];
    ogObject.ogImageType = ogObject.ogImageType ? ogObject.ogImageType : [null];
  }
  var ogImages = _.zip(
    ogObject.ogImage,
    ogObject.ogImageWidth,
    ogObject.ogImageHeight,
    ogObject.ogImageType
  )
    .map(mediaMapper)
    .sort(mediaSorter);

  /* Combine video/width/height/type
      and sort for priority */
  if (ogObject.ogVideo || ogObject.ogVideoWidth || ogObject.ogVideoHeight || ogObject.ogVideoType) {
    ogObject.ogVideo = ogObject.ogVideo ? ogObject.ogVideo : [null];
    ogObject.ogVideoWidth = ogObject.ogVideoWidth ? ogObject.ogVideoWidth : [null];
    ogObject.ogVideoHeight = ogObject.ogVideoHeight ? ogObject.ogVideoHeight : [null];
    ogObject.ogVideoType = ogObject.ogVideoType ? ogObject.ogVideoType : [null];
    ogObject.ogVideoDuration = ogObject.ogVideoDuration ? ogObject.ogVideoDuration : [null];
  }
  var ogVideos = _.zip(
    ogObject.ogVideo,
    ogObject.ogVideoWidth,
    ogObject.ogVideoHeight,
    ogObject.ogVideoType,
    ogObject.ogVideoDuration
  )
    .map(mediaMapper)
    .sort(mediaSorter);

  /* Combine twitter image/width/height/alt
      and sort for priority */
  if (
    ogObject.twitterImageSrc ||
    ogObject.twitterImage ||
    ogObject.twitterImageWidth ||
    ogObject.twitterImageHeight ||
    ogObject.twitterImageAlt
  ) {
    ogObject.twitterImage = ogObject.twitterImage
      ? ogObject.twitterImage
      : ogObject.twitterImageSrc;
    ogObject.twitterImage = ogObject.twitterImage ? ogObject.twitterImage : [null];
    ogObject.twitterImageWidth = ogObject.twitterImageWidth ? ogObject.twitterImageWidth : [null];
    ogObject.twitterImageHeight = ogObject.twitterImageHeight
      ? ogObject.twitterImageHeight
      : [null];
    ogObject.twitterImageAlt = ogObject.twitterImageAlt ? ogObject.twitterImageAlt : [null];
  }
  var twitterImages = _.zip(
    ogObject.twitterImage,
    ogObject.twitterImageWidth,
    ogObject.twitterImageHeight,
    ogObject.twitterImageAlt
  )
    .map(mediaMapperTwitterImage)
    .sort(mediaSorter);

  /* Combine twitter player/width/height/stream
      and sort for priority */
  if (
    ogObject.twitterPlayer ||
    ogObject.twitterPlayerWidth ||
    ogObject.twitterPlayerHeight ||
    ogObject.twitterPlayerStream
  ) {
    ogObject.twitterPlayer = ogObject.twitterPlayer ? ogObject.twitterPlayer : [null];
    ogObject.twitterPlayerWidth = ogObject.twitterPlayerWidth
      ? ogObject.twitterPlayerWidth
      : [null];
    ogObject.twitterPlayerHeight = ogObject.twitterPlayerHeight
      ? ogObject.twitterPlayerHeight
      : [null];
    ogObject.twitterPlayerStream = ogObject.twitterPlayerStream
      ? ogObject.twitterPlayerStream
      : [null];
  }
  var twitterPlayers = _.zip(
    ogObject.twitterPlayer,
    ogObject.twitterPlayerWidth,
    ogObject.twitterPlayerHeight,
    ogObject.twitterPlayerStream
  )
    .map(mediaMapperTwitterPlayer)
    .sort(mediaSorter);

  // Delete temporary fields
  fieldsArray
    .filter(function(item) {
      return item.multiple;
    })
    .forEach(function(item) {
      delete ogObject[item.fieldName];
    });

  // Select the best image
  if (ogImages.length) {
    if (options.allMedia) {
      ogObject.ogImage = ogImages;
    } else {
      ogObject.ogImage = ogImages[0];
    }
  }

  // Select the best video
  if (ogVideos.length) {
    if (options.allMedia) {
      ogObject.ogVideo = ogVideos;
    } else {
      ogObject.ogVideo = ogVideos[0];
    }
  }

  // Select the best twitter image
  if (twitterImages.length) {
    if (options.allMedia) {
      ogObject.twitterImage = twitterImages;
    } else {
      ogObject.twitterImage = twitterImages[0];
    }
  }

  // Select the best player
  if (twitterPlayers.length) {
    if (options.allMedia) {
      ogObject.twitterPlayer = twitterPlayers;
    } else {
      ogObject.twitterPlayer = twitterPlayers[0];
    }
  }

  // Check for 'only get open graph info'
  if (!options.onlyGetOpenGraphInfo) {
    // Get title tag if og title was not provided
    if (!ogObject.ogTitle && $('head > title').text() && $('head > title').text().length > 0) {
      ogObject.ogTitle = $('head > title').text();
    }
    // Get meta description tag if og description was not provided
    if (
      !ogObject.ogDescription &&
      $('head > meta[name="description"]').attr('content') &&
      $('head > meta[name="description"]').attr('content').length > 0
    ) {
      ogObject.ogDescription = $('head > meta[name="description"]').attr('content');
    }
    // Get first image as og:image if there is no og:image tag.
    if (!ogObject.ogImage && ogImageFallback) {
      var supportedImageExts = ['jpg', 'jpeg', 'png'];
      $('img').each(function(i, elem) {
        if (
          $(elem).attr('src') &&
          $(elem).attr('src').length > 0 &&
          supportedImageExts.indexOf(
            $(elem)
              .attr('src')
              .split('.')
              .pop()
          ) !== -1
        ) {
          ogObject.ogImage = {
            url: $(elem).attr('src')
          };
          return false;
        }
      });
    }
  }

  return ogObject;
}
