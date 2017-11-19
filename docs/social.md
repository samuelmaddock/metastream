# Application user networking using Dat protocol

This document outlines a structure to connect application users using [Dat protocol](https://datproject.org/). Users can identify themselves with a dat archive and publish session metadata to coordinate WebRTC connections.

Forewarning: I have no idea what I'm talking about.

## Social peer dat archive

A user's identity resides in a dat archive which can be shared to create a connection.

### profile.json

Profiles contain data to identify the user.

```json5
{
	// Name
	"name": "Sam",

	// Join date
	"created": 1509818932375,

	// List of friend archives (optional)
	"friends": [
		"dat://asdf1234",
		"dat://asdf4567",
		"dat://asdf8901",
	]
}
```

### session.json

If this file exists in an archive, the user is hosting an active session. Metadata associated with the session is available here. A url is included as a pointer for the client to initiate a direct connection with the host.

```json5
{
	// Public name
	"name": "Foobar",

	// Session lobby archive
	"url": "dat://asdf1234",

	// Heartbeat of session -- updates every 5 min
	"last_update": 1509667197878,

	// Number of connected peers
	"peers": 2,

	// Maximum number of peers
	"max_peers": 8,

	// Password required upon connection
	"protected": false
}
```

## Session lobby - Dat archive (Option 1)

Session lobbies are used to connect peers to the host's WebRTC data channel connection via signaling over the [hyperdrive](https://github.com/mafintosh/hyperdrive) file system. **This proposal requires multi-user writing to dat archives.**

### host.offer.bin
A binary file containing the initial SDP signal data of the host.

### [dat-hash].offer.bin
A binary file containing the SDP offer data for the given peer hash.
This file is transient and will be removed after a connection is established.

### [dat-hash].answer.bin
A binary file containing the SDP answer data for the given peer hash.
This file is transient and will be removed after a connection is established.

## Session lobby - hypercore log (Option 2)

Another option for coordinating WebRTC signaling is to use a distibuted, append-only log with [hypercore](https://github.com/mafintosh/hypercore).

The signaling process would look like the following
1. User A, the host, writes their initial SDP signal data to the log.
2. User B reads the initial SDP signal to generate an offer and writes it the log.
3. User A reads the offer and writes their corresponding answer to the log.
4. User B reads the answer and uses it to establish a WebRTC connection.

### Current unknowns
- How does hypercore relate to dat archives?
- Can multiple users write to a hypercore log?

## Links
- https://datproject.org/
- https://github.com/mafintosh/hypercore
- https://github.com/mafintosh/hyperdrive
- https://github.com/Rotonde/rotonde-client
- [The Peer-to-Peer Web - Paul Frazee](https://www.youtube.com/watch?v=-ep0ZIe6i10)
