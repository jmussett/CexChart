export default class CexWsClient {
  constructor() {
    this.unauthenticatedHandler = () => {};
    this.tickHandler = () => {};
    this.connectedHandler = () => {};
    this.initialOhlcHandler = () => {};
    this.ohlcUpdateHandler = () => {};
  }
  initialise() {
    console.log("init");
      this.ws = new WebSocket('wss://ws.cex.io/ws/');
      this.ws.onmessage = msg => {
        var response = JSON.parse(msg.data);

        switch(response.e) {
          case "connected":
            this.requestOhlcFeed(this.period || "1m");
            break;
          case "init-ohlcv-data":
            this.initialOhlcHandler(response.data);
            break;
          case "ohlcv1m":
            this.ohlcUpdateHandler(response.data);
            break;
          case "tick":
            console.log(response.data)
            break;
          case "ohlcv":
            break;
          case "ohlcv24":
            break;
          default:
            console.log("unknown response from server: " + msg.data);
        }
      };

      this.ws.onerror = e => this.errorHandler(e);
      this.ws.onclose = e => this.initialise();
  }
  requestOhlcFeed(period) {
    this.ws.send(JSON.stringify({
          "e": "init-ohlcv",
          "i": period,
          "rooms": [
            "pair-BTC-USD"
          ]
        }));

    this.period = period;
  }
  close() {
    this.ws.close();
  }
}