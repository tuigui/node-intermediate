import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../constants/env.constant.js";
import { prisma } from "../utils/prisma.util.js";

export const requireAccessToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        messages: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN,
      });
    }

    const [type, accessToken] = authorization.split(" ");

    if (type !== "Bearer") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        messages: MESSAGES.AUTH.COMMON.JWT.NOT_SUPPORTED_TYPE,
      });
    }

    if (!accessToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        messages: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN,
      });
    }

    let payload;
    try {
      payload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          messages: MESSAGES.AUTH.COMMON.JWT.EXPIRED,
        });
      } else {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          messages: MESSAGES.AUTH.COMMON.JWT.INVALID,
        });
      }
    }

    const { id } = payload;
    const user = await prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        messages: MESSAGES.AUTH.COMMON.JWT.NO_USER,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
