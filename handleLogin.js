import { config } from "dotenv-flow";
import chalkTemplate from "chalk-template";

config();

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CSRFTOKEN = process.env.CSRFTOKEN;

const messages = {
  requestHeaders: chalkTemplate`
        {bold Request Headers}
  `,
};
const handleLogin = (request, response) => {
  if (
    request.headers["content-type"]?.includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      const params = new URLSearchParams(body);
      const username = params.get("username");
      const password = params.get("password");
      if (username === USERNAME && password === PASSWORD) {
        response.setHeader(
          "Set-Cookie",
          `csrftoken=${CSRFTOKEN}; expires=Fri, 23 Jun 2023 12:22:38 GM; Max-Age=31449600;SameSite=Lax; Path=/`
        );
        response.writeHead(204);
        response.end();
      } else {
        response.setHeader("Content-Type", "application/json");
        response.writeHead(400);
        response.end(
          JSON.stringify({
            __all__: [
              "Please enter a correct username and password. Note that both fields may be case-sensitive.",
            ],
          })
        );
      }
    });
  } else if (request.headers.cookie.includes(`csrftoken=${CSRFTOKEN}`)) {
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(messages.requestHeaders);
      console.log(request.headers);
    }
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        authenticated: true,
        external_auth_url: null,
        no_users: false,
      })
    );
  } else {
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        authenticated: false,
        external_auth_url: null,
        no_users: false,
      })
    );
  }
};

const handleLogout = (request, response) => {
  response.clearCookie("csrftoken");
  response.writeHead(204);
  response.end();
};

export { handleLogin, handleLogout };
