const _createElement = document.createElement;
document.createElement = function() {
	const result = _createElement.apply(this, arguments);
	return result;
};

// HACK: netflix
const customVideoSession = (VideoSession) => {
	function CustomVideoSession() {
		VideoSession.apply(this, arguments);

		this._createPlayer = this.createPlayer;
		console.debug('CONSTRUCT CUSTOM VIDEO SESSION', this);

		this.createPlayer = function() {
			console.debug('CREATE PLAYER', this, arguments);
			const player = this._createPlayer.apply(this, arguments);
			window.NETFLIXPLAYER = player;
			return player;
		};
	}

	CustomVideoSession.prototype = VideoSession;

	return CustomVideoSession;
};

var target = {};
var handler = {
	set: function(target, propertyName, value, receiver) {
		if (propertyName === 'player') {
      value.VideoSession = customVideoSession(value.VideoSession);
      console.debug('ASSIGNED CUSTOM VIDEO SESSION');
		}

		target[propertyName] = value;
		return true;
	}
};

var p = new Proxy(target, handler);
window.netflix = p;

console.log('Setup proxy netflix object');
