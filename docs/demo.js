/**
 * Demo script for app screenshots.
 */
Object.assign(app.store.getState(), {
  router: {
    location: { pathname: '/lobby/create', search: '', hash: '' }
  },
  lobby: { network: 0 },
  chat: {
    messages: [
      {
        author: {
          id: '2',
          username: 'Hunter'
        },
        content: 'that was 👌',
        timestamp: Date.now()
      }
    ]
  },
  mediaPlayer: {
    playback: 1,
    repeatMode: 1,
    queue: [
      {
        type: 'item',
        id: '5',
        url: 'https://www.hulu.com/watch/1267548',
        title: 'My Hero Academia: (Sub) Drive It Home, Iron Fist!!!',
        description: '',
        imageUrl: {
          url:
            'http://img1.ak.crunchyroll.com/i/spire4/e8e3c09f8450c3d8a90a03e2198688f61515484130_large.jpg',
          width: null,
          height: null,
          type: null
        },
        requestUrl: 'https://www.hulu.com/watch/1267548',
        ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
        ownerName: 'Sam',
        state: {}
      },
      {
        type: 'item',
        id: '3',
        url:
          'https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F257108978&show_artwork=true&autoplay=true&auto_play=true',
        title: 'reddit.com/r/videos',
        description: 'listen 2 my acovadoes and bananis',
        imageUrl: {
          url: 'https://i1.sndcdn.com/artworks-000156240197-eo6na1-t500x500.jpg',
          width: '500',
          height: '500',
          type: null
        },
        requestUrl: 'https://soundcloud.com/maya-ampora-ochoa/macross-82-99-mix-4-amidiscs',
        ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
        ownerName: 'Austin',
        state: {}
      },
      {
        type: 'item',
        id: '1',
        url:
          'https://www.netflix.com/watch/70069630?trackId=13752289&tctx=0%2C3%2C330c2bfb-6c7d-4679-b779-511e45957516-10850552%2C%2C',
        title: 'The Office (U.S.) | Netflix',
        description:
          'An assassin is shot by her ruthless employer, Bill, and other members of their assassination circle. But she lives -- and plots her vengeance.',
        imageUrl: {
          url:
            'https://occ-0-2433-2430.1.nflxso.net/art/29a19/f0b11727e4c156e9b4465ad52d539cfa9d829a19.jpg',
          width: null,
          height: null,
          type: null
        },
        requestUrl:
          'https://www.netflix.com/watch/60031236?trackId=14170056&tctx=14%2C0%2C9e8b0b2f-7daf-4f65-a871-477a25d274e9-9562447',
        ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
        ownerName: 'Hunter',
        state: {}
      },
      {
        id: 'rycY7y6Pm',
        type: 'item',
        url: 'https://www.youtube.com/embed/7LEmer7wwHI?autoplay=true&auto_play=true',
        title: 'Piano Studio Ghibli Complete Collection 2016',
        duration: 5596000,
        description:
          "Best Relaxing Piano Studio Ghibli Complete Collection 2016\n-----------------------------------------------------------------------------------------------------------\n(Part 01)\nRelaxing Piano - Hayao Miyazaki Collection:\n0:00:03 Kiki's Delivery Service - Umi no Mieru Machi\n0:04:46 Princess Mononoke - Mononoke Hime\n0:06:26 My Neighbor Totoro - Kaze no Toori Michi\n0:11:53 Porco Rosso - Toki ni wa Mukashi no Hanashi wo\n0:17:38 Kiki's Delivery Service - Yasashisa ni Tsutsumareta nara\n0:23:01 My Neighbor Totoro - Tonari no Totoro\n0:27:22 Nausicaä of the Valley of the Wind - Kaze no Tani no Naushika\n0:32:10 Laputa: Castle in the Sky - Kimi wo Nosete\n0:37:39 Spirited Away - Inochi no Namae\n\n(PART 02) \nRelaxing Piano - Ghibli Collection: \n0:43:28 From Up on Poppy Hill - Sayonara no Natsu - Kokuriko-zaka kara\n0:48:46 Whisper of the Heart - Take Me Home ***\n0:54:26 Kiki's Delivery Service - Message By Rouge\n0:59:15 My Neighbor Totoro - Stroll\n1:04:01 Tales from Earthsea - Teru's Song\n1:09:24 The Secret World of Arrietty - Arrietty's Song\n1:14:11 Ponyo - Ponyo on the Cliff by the Sea\n1:18:01 Nausicaä of the Valley of the Wind - Nausicaa Requiem\n1:22:15 Howl's Moving Castle - The Promise of the World\n1:27:44 Spirited Away - Reprise\n\nOTHER VIDEO: \nRelaxing Piano Studio Ghibli Complete Collection スタジオジブリ宮崎駿リラクシング·ピアノ音楽 :\nhttps://www.youtube.com/watch?v=v5RHM...\n\nRelaxing Piano Studio Ghibli Complete Collection :\nhttps://www.youtube.com/watch?v=NkkU3...\n\nStudio Ghibli Piano Collection スタジオジブリピアノメドレー【作業用、勉強、睡眠用BGM】 \nhttps://www.youtube.com/watch?v=OPNPx...\n\nrelaxing Piano Studio Ghibli Complete Collection スタジオジブリ宮崎駿リラクシング·ピアノ音楽 \nhttps://www.youtube.com/watch?v=s9YnI...",
        imageUrl: {
          url: 'https://i.ytimg.com/vi/7LEmer7wwHI/maxresdefault.jpg',
          width: null,
          height: null,
          type: null
        },
        requestUrl: 'https://www.youtube.com/watch?v=7LEmer7wwHI',
        ownerId: '13339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
        ownerName: 'Sam',
        state: { referrer: true }
      },
      {
        id: 'SyM24k6PQ',
        type: 'item',
        url: 'https://www.youtube.com/embed/I0JVRcJLea8?autoplay=true&auto_play=true',
        title: 'Junko Ohashi - Telephone Number (1984)',
        duration: 239000,
        description:
          'from: Magical (1984)\n\nI do not own copyrights to this video, neither I get any financial or any other benefit from it. It is merely for entertainment and promotional purposes.',
        imageUrl: {
          url: 'https://i.ytimg.com/vi/I0JVRcJLea8/maxresdefault.jpg',
          width: null,
          height: null,
          type: null
        },
        requestUrl: 'https://www.youtube.com/watch?v=I0JVRcJLea8',
        ownerId: '13339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
        ownerName: 'Sam',
        state: { referrer: true }
      },
      {
        type: 'item',
        id: '4',
        url:
          'https://www.youtube.com/embed/Uno1OOvX5sU?autoplay=1&controls=0&fs=0&rel=0&showinfo=0&iv_load_policy=3',
        title: 'PUBG 1.0 Highlights - Episode 2',
        duration: 603000,
        description:
          "Send your clips to BattlegroundsHighlights@gmail.com\nFAQ: http://www.dearsomeone.net/pubgfaq\nTwitter: https://twitter.com/dearsomeone\n\nThis video is not monetized due to the copyrighted music.\n\nMusic:\nMuse - Uprising\nBon Jovi - Runaway\n\nDo you have a Replay file you'd like to send in?  Here's a video on how to backup and share your Replays. https://youtu.be/fCaIXoHM58k\n\nThanks to Kingpin Crazy, WoofQuack and anyone who submitted a clip.  If you didn’t see your clip in this video, you may see it in the future.  No need to resubmit. \n\nThanks for watching!\nhttp://www.dearsomeone.net/",
        imageUrl: 'https://i.ytimg.com/vi/Uno1OOvX5sU/mqdefault.jpg',
        requestUrl: 'https://www.youtube.com/watch?v=Uno1OOvX5sU&t=1s',
        ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
        ownerName: 'Austin',
        state: {}
      },
      {
        type: 'item',
        id: '8',
        url: 'data:text/html,<style>body { background: #00ff00; }</style>',
        title: 'Green Screen',
        description: '',
        imageUrl: {
          url:
            'http://img1.ak.crunchyroll.com/i/spire4/e8e3c09f8450c3d8a90a03e2198688f61515484130_large.jpg',
          width: null,
          height: null,
          type: null
        },
        requestUrl: 'https://www.hulu.com/watch/1331713',
        ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
        ownerName: 'Sam',
        state: {}
      }
    ],
    serverClockSkew: 0,
    current: {
      type: 'item',
      id: '6',
      url:
        'https://www.youtube.com/embed/l8wMVmY7Zpw?autoplay=1&controls=0&fs=0&rel=0&showinfo=0&iv_load_policy=3',
      title: '[SFM] Berdst friend by anonym00se',
      description: 'info',
      duration: 39181,
      imageUrl: 'https://i.ytimg.com/vi/8AtcaspHKRg/mqdefault.jpg',
      requestUrl: 'https://www.youtube.com/watch?v=I7Tps0M-l64',
      ownerId: '14e3a386e9195cfeaf92ec57224fd3c4e518b58811e448bb59181cd8c2b8480c',
      ownerName: 'Sam',
      state: {}
    },
    startTime: Date.now() - 40
  },
  users: {
    host: '13339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
    map: {
      '13339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506': {
        id: '13339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
        name: 'Sam',
        avatar:
          'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/a7/a7b5859365dcbf6be35229ae8b86567fcbd57ebf_full.jpg',
        color: '#00bfff',
        role: 2
      },
      '23339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506': {
        id: '23339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
        name: 'Hunter',
        avatar:
          'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/8e/8e2b92368f4e7b6216ca8c8c43c3da0571c03238_full.jpg'
      },
      '33339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506': {
        id: '33339291c5a824288f0844f00d67a7defce9674acda3b2c28aad9c7bf0101506',
        name: 'Austin',
        avatar:
          'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/47/4776820c4883336b1e44b6fa6d7f3caaff22551a_full.jpg'
      }
    }
  }
})
