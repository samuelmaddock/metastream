let steamClient: Steamworks.API;

try {
  steamClient = window.require('./steamworks');
} catch (e) {
  console.log('Failed to load steamworks');
  console.error(e);
  alert(e.message);

  // Error will lead to program terminating
  steamClient = null as any;
}

export const steamworks = steamClient;
