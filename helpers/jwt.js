import expressJwt from "express-jwt";

function authJWT() {
  const secret = process.env.secret;
  return expressJwt({
    secret,
    algorithms: ["HS256"],
  });
}

export default authJWT;
