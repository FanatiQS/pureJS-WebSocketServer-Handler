This is just the beginnings of a javascript library that can be used to set up a WebSocket server with all the WebSocket and HTTP handling done in pure javascript.

The idea is to build a pure javascript socket handler that only requires simple read and write functionallity.
Since all socket handling is done in javascript, code using this library would be easier to implement in multiple environments since it only requires access to javascript callbacks.

For example, this library could be used in both an iOS and an Android app. The native code would only require running the javascript code in a javascript context and creating a socket server. For every socket connection in the native app, it would also run the "createSocket" function in the javascript context. When running that function, the native code would give the javascript code an argument that is a native function (javascript to native) and the return value from running that function would return a javascript function (native to javascript). Whenever that socket would get new data, the native code would run the "native to javascript" function with that data and if the javascript code wanted to send data to another socket, it would run that sockets "javascript to native" function.
