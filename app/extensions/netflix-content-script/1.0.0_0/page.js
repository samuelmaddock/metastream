console.log('----- NETFLIX CONTENT SCRIPT INIT -----');

const elem = document.createElement('script');
elem.src = chrome.runtime.getURL('netflix-player.js');
document.documentElement.appendChild(elem);

console.log('----- NETFLIX CONTENT SCRIPT END -----');
