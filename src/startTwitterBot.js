const Twit = require("twit");
const utils = require("./utils");
const config = require("./config");
const createUpdatedMessage = require("./createUpdatedMessage");
const axios = require("axios").default;

let lastPrice;

const createMedia = async (base64, Twitter) =>
    (await Twitter.post("media/upload", { media_data: base64 }))
        .data.media_id_string;

const tweet = async (coin, Twitter) => {
    const { message, price } = await createUpdatedMessage(coin, lastPrice);

    lastPrice = price;

    const url = `${config.charts_api_url}/candlestick/binance?coin=btc&interval=1m&limit=31`;
    const b64 = (await axios.get(url)).data.base64.replace(
        "data:image/png;base64,",
        ""
    );

    const mediaId = await createMedia(b64, Twitter);

    Twitter.post("statuses/update", {
        status: message,
        media_ids: [mediaId],
    })
        .then(({ data }) => console.log("Tweeted at", data.created_at))
        .catch((error) => console.error(error));
};

const startTwitterBot = (coin, intervalMinutes) => {
    const Twitter = new Twit({
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        access_token: config.access_token,
        access_token_secret: config.access_token_secret,
    });

    const intervalMs = utils.minutesToMs(intervalMinutes);

    tweet(coin, Twitter);
    setInterval(() => tweet(coin, Twitter), intervalMs);
};

module.exports = startTwitterBot;
