import {
	isWebSocketUpgrade,
	makeWebSocketUpgradeResponse,
	makeFailedHttpUpgradeResponse,
	getWebSocketOpCode,
	opCodes,
	getWebSocketTextPayload,
	getWebSocketBinaryPayload,
	getWebSocketCloseCode,
	getWebSocketCloseReason,
	makeWebSocketTextFrame,
	makeWebSocketBinaryFrame,
	makeWebSocketCloseFrame,
	makeWebSocketPingFrame,
	makeWebSocketPingResponse
} from '../src/websocket.js';

import http from 'http';



const server = http.createServer((req, res) => {
	switch (req.url) {
		case "/": {
			res.end(`<script>
			const ws = new WebSocket(location.href.replace('http', 'ws'));
			ws.onopen = function () {
				console.log('open');
				ws.send('123456');
			};
			ws.onmessage = function (event) {
				console.log('message', event.data);
			}
			ws.onclose = function () {
				console.log('close', ...arguments);
			};
			ws.onerror = function () {
				console.error('error', ...arguments);
			}
			console.log(ws);
			</script>`);
			break;
		}
		default: {
			res.statusCode = 404;
			res.end("404");
			break;
		}
	}
});

server.on('upgrade', (req, socket) => {
	let done = false;

	// Catches HTTP errors for upgrade request
	try {
		isWebSocketUpgrade(req);
	}
	catch (err) {
		socket.end(makeFailedHttpUpgradeResponse(err));
		return;
	}

	// Send HTTP upgrade to websocket
	socket.write(makeWebSocketUpgradeResponse(req));

	// Listen for websocket data
	socket.on('data', (data) => {
		let opCode
		try {
			opCode = getWebSocketOpCode(data);
		}
		catch (err) {
			socket.write(makeWebSocketCloseFrame(err.closeCode));
			return;
		}

		switch (opCode) {
			case opCodes.text: {
				const msg = getWebSocketTextPayload(data);
				console.log('text', msg);

				if (msg === 'close') {
					socket.write(makeWebSocketCloseFrame(4999, "test"));
					done = true;
				}
				else if (msg === 'ping') {
					socket.write(makeWebSocketPingFrame());
				}
				else if (msg === 'message') {
					socket.write(makeWebSocketTextFrame('test'));
				}
				else if (msg === 'binary') {
					socket.write(makeWebSocketBinaryFrame(new Uint8Array([ 48, 49, 50 ])));
				}

				break;
			}
			case opCodes.binary: {
				const buffer = getWebSocketBinaryPayload(data);
				console.log('binary', buffer);
				break;
			}
			case opCodes.close: {
				console.log('close', getWebSocketCloseCode(data), getWebSocketCloseReason(data));
				socket.end((!done) ? makeWebSocketCloseFrame() : undefined); // Respond with close frame if it was initiated by the client
				break;
			}
			case opCodes.pong: {
				console.log('pong', getWebSocketTextPayload(data));
				break;
			}
			case opCode.ping: {
				console.log('Got ping request');
				socket.write(makeWebSocketPingResponse(data));
				break;
			}

			// Does not support fragmented frames
			case opCode.bufferText:
			case opCode.bufferBinary:
			case opCode.bufferContinue:
			case opCode.bufferEnd: {
				socket.write(makeWebSocketCloseFrame(1003));
				throw new Error('This WebSocket implementation does not support fragmented frames');
			}
			default: {
				throw new Error("Unknown opCode:", opCode);
			}
		}
	});

	// Listen for tcp socket close
	socket.on('close', () => {
		console.log('tcp close');
		done = true;
	});

});

server.listen(3000);
