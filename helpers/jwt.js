import expressJwt from "express-jwt";

function authJWT() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  return expressJwt({
    secret,
    algorithms: ["HS256"],
  }).unless({
    path: [
      {
        //   Regular expression to get everything related to de route
        url: /\/api\/v1\/products(.*)/,
        methods: ["GET", "OPTIONS"],
      },
      {
        url: /\/api\/v1\/categories(.*)/,
        methods: ["GET", "OPTIONS"],
      },
      `${api}/users/login`,
      `${api}/users/register`,
    ],
  });
}

export default authJWT;
