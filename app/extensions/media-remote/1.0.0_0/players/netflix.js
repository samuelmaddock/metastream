const script = document.createElement('script');
script.src = chrome.runtime.getURL('players/netflix-global.js');
document.documentElement.appendChild(script);
