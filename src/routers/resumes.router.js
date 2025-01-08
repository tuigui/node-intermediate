import express from "express";
import { HTTP_STATUS } from "../constants/http-status.constant.js";
import { MESSAGES } from "../constants/message.constant.js";
import { createResumeValidator } from "../middlewares/validators/create-resume-validator.middleware.js";
import { prisma } from "../utils/prisma.util.js";
import { updateResumeValidator } from "../middlewares/validators/updated-resume-validator.middleware.js";
import { USER_ROLE } from "../constants/user.constant.js";
import { requireRoles } from "../middlewares/require-roles.middleware.js";
import { updateResumeStatusValidator } from "../middlewares/validators/update-resume-status-validator.middleware copy.js";

const resumesRouter = express.Router();

resumesRouter.post("/", createResumeValidator, async (req, res, next) => {
  try {
    const user = req.user;
    const { title, content } = req.body;
    const authorId = user.id;
    const data = await prisma.resume.create({
      data: {
        authorId,
        title,
        content,
      },
    });
    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.RESUMES.CREATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

resumesRouter.get("/", async (req, res, next) => {
  try {
    const user = req.user;
    const authorId = user.id;
    let { sort } = req.query;
    sort = sort?.toLowerCase();
    if (sort !== "desc" && sort !== "asc") {
      sort = "desc";
    }

    const whereCondition = {};
    if (user.role === USER_ROLE.RECRUITER) {
      const { status } = req.query;
      if (status) {
        whereCondition.status = status;
      }
    } else {
      whereCondition.authorId = authorId;
    }

    let data = await prisma.resume.findMany({
      where: whereCondition,
      orderBy: { createdAt: sort },
      include: {
        author: true,
      },
    });

    data = data.map((resume) => {
      return {
        id: resume.id,
        authorName: resume.author.name,
        title: resume.title,
        content: resume.content,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_LIST.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

resumesRouter.get("/:id", async (req, res, next) => {
  try {
    const user = req.user;
    const authorId = user.id;
    const { id } = req.params;

    const whereCondition = { id: +id };
    if (user.role !== USER_ROLE.RECRUITER) {
      whereCondition.authorId = authorId;
    }

    let data = await prisma.resume.findUnique({
      where: whereCondition,
      include: { author: true },
    });

    if (!data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    data = {
      id: data.id,
      authorName: data.author.name,
      title: data.title,
      content: data.content,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_DETAIL.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

resumesRouter.put("/:id", updateResumeValidator, async (req, res, next) => {
  try {
    const user = req.user;
    const authorId = user.id;
    const { id } = req.params;
    const { title, content } = req.body;

    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    if (!existedResume) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    const data = await prisma.resume.update({
      where: { id: +id, authorId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.UPDATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

resumesRouter.delete("/:id", async (req, res, next) => {
  try {
    const user = req.user;
    const authorId = user.id;
    const { id } = req.params;

    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    if (!existedResume) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    const data = await prisma.resume.delete({ where: { id: +id, authorId } });
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.DELETE.SUCCEED,
      data: { id: data.id },
    });
  } catch (error) {
    next(error);
  }
});

resumesRouter.patch(
  "/:id/status",
  requireRoles([USER_ROLE.RECRUITER]),
  updateResumeStatusValidator,
  async (req, res, next) => {
    try {
      const user = req.user;
      const recruiterId = user.id;

      const { id } = req.params;

      const { status, reason } = req.body;

      await prisma.$transaction(async (tx) => {
        const existedResume = await tx.resume.findUnique({
          where: { id: +id },
        });
        if (!existedResume) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            status: HTTP_STATUS.NOT_FOUND,
            message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
          });
        }

        const updatedResume = await tx.resume.update({
          where: { id: +id },
          data: { status },
        });

        const data = await tx.resumeLog.create({
          data: {
            recruiterId,
            resumeId: existedResume.id,
            oldStatus: existedResume.status,
            newStatus: updatedResume.status,
            reason,
          },
        });

        return res.status(HTTP_STATUS.OK).json({
          status: HTTP_STATUS.OK,
          message: MESSAGES.RESUMES.UPDATE.STATUS.SUCCEED,
          data,
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

resumesRouter.get(
  "/:id/logs",
  requireRoles([USER_ROLE.RECRUITER]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      let data = await prisma.resumeLog.findMany({
        where: { resumeId: +id },
        orderBy: { createdAt: "desc" },
        include: {
          recruiter: true,
        },
      });

      data = data.map((log) => {
        return {
          id: log.id,
          recruiterName: log.recruiter.name,
          resumeId: log.resumeId,
          oldStatus: log.oldStatus,
          newStatus: log.newStatus,
          reason: log.reason,
          createdAt: log.createdAt,
        };
      });

      return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: MESSAGES.RESUMES.READ_LIST.SUCCEED,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { resumesRouter };
