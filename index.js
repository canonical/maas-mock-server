#!/usr/bin/env node

import httpServer from "./httpServer.js";
import webSocketServer from "./webSocketServer.js";
import fetchMockData from "./fetchMockData.js";
import { config } from "dotenv-flow";
import chalkTemplate from "chalk-template";

config({ silent: true });
const MOCK_PATH = process.env.MOCK_PATH;

const logRequest = (request) => {
  console.log(chalkTemplate`
      upgrade
      {bold ${request.url}}
  `);

  if (process.env.LOG_LEVEL === "verbose") {
    console.log(chalkTemplate`
      ${
        request.headers["x-forwarded-for"]
          ? `request.headers["x-forwarded-for"]`
          : `request.connection.remoteAddress`
      }
      {bold ${
        request.headers["x-forwarded-for"] || request.socket.remoteAddress
      }}
    `);
  }
};

async function main() {
  const defaultPath = MOCK_PATH;
  let enabledMock = defaultPath;
  let mocks = {
    [defaultPath]: await fetchMockData(defaultPath),
  };

  const setMockFromUrl = async (url) => {
    const data = await fetchMockData(url);
    mocks = { ...mocks, [url]: data };
    enabledMock = url;
    await data;
  };
  const getMockData = async (url = enabledMock) => {
    if (url in mocks) {
      return JSON.parse(mocks[url]);
    } else {
      await JSON.parse(setMockFromUrl(url));
    }
  };
  const getEnabledMock = () => enabledMock;

  const wss = await webSocketServer(getMockData);
  const server = httpServer(setMockFromUrl, getEnabledMock);

  server.on("upgrade", function upgrade(request, socket, head) {
    logRequest(request);

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  });
}

main();
