import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";

export const requireRoles = (roles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      const hasPermission = user && roles.includes(user.role);

      if (!hasPermission) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({
            status: HTTP_STATUS.FORBIDDEN,
            message: MESSAGES.AUTH.COMMON.FORBIDDEN,
          });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
