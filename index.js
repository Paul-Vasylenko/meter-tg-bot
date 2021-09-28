const TelegramApi = require("node-telegram-bot-api");
var XMLHttpRequest = require("xhr2");

require("dotenv").config();
const FIVE_MINUTES = 1000 * 60 * 5;
class MeterBot {
  METER_STRING;
  bot;
  lastMETAR;
  lastTAF;
  constructor() {
    this.METER_STRING = "";
    this.bot = new TelegramApi(process.env.TOKEN, {
      polling: true,
    });
    this.lastMETAR = "";
    this.lastTAF = "";
    this.bot.on("polling_error", console.log);
    this.setBotActions();
  }

  setCommands = () => {
    this.bot.setMyCommands([
      { command: "/help", description: "CommandList" },
      { command: "/start", description: "Start" },
      { command: "/subscribe", description: "subscribe" },
      { command: "/getshort", description: "get TAF and METAR" },
      { command: "/gettaf", description: "get TAF" },
      { command: "/getmetar", description: "get METAR" },
    ]);
  };

  sendOne = (msg, type, ignoreLastData) => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", process.env.SITE);
    xhr.send();
    xhr.onload = () => {
      if (xhr.status != 200) {
        this.bot.sendMessage(
          msg.chat.id,
          `Ошибка ${xhr.status}: ${xhr.statusText}`
        );
      } else {
        const response = xhr.response;
        const startIndex = response.indexOf(`<b>${type}:</b>`);
        const endIndex = response.indexOf("</p>", startIndex);
        const res = response.substr(
          startIndex + 13,
          endIndex - startIndex - 13
        );
        if (ignoreLastData || res !== this[`${type}`]) {
          this.bot.sendMessage(msg.chat.id, `${type}: ` + res);
          this[`${type}`] = res;
        }
      }
    };
  };
  setBotActions = () => {
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(
        msg.chat.id,
        `/subscribe - to subscribe for every 30 min. weather forecast
/getshort - to weather forecast now
/gettaf - to get TAF
/getmetar - to get metar`
      );
    });
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(msg.chat.id, "Run /help for start!");
    });
    this.bot.onText(/\/getshort/, (msg) => {
      this.getShort(msg, true);
    });
    this.bot.onText(/\/gettaf/, (msg) => {
      this.sendOne(msg, "TAF", true);
    });
    this.bot.onText(/\/getmetar/, (msg) => {
      this.sendOne(msg, "METAR", true);
    });
    this.bot.onText(/\/subscribe/, (msg) => {
      this.getShort(msg, true);
      setInterval(() => {
        this.getShort(msg);
      }, FIVE_MINUTES);
    });
  };
  getShort = (msg, ignoreLastData = false) => {
    this.sendOne(msg, "METAR", ignoreLastData);
    this.sendOne(msg, "TAF", ignoreLastData);
  };
}

const bot = new MeterBot();
bot.setCommands();
