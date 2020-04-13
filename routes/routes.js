const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");
const User = require("../models").User;
const Course = require("../models").Course;

// async handler
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

const authenticateUser = asyncHandler(async (req, res, next) => {
  let message = null;
  const credentials = auth(req);

  if (credentials) {
    const user = await User.findAll({
      where: {
        emailAddress: credentials.name,
      },
    });

    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user[0].dataValues.password
      );

      if (authenticated) {
        req.currentUser = user[0].dataValues;
      } else {
        message = "Authentication failed";
      }
    } else {
      message = "User not found";
    }
  } else {
    message = "Auth header not found";
  }

  if (message) {
    console.warn(message);
    res.status(400).json({
      message: "Access Denied"
    });
  }

  next();
});

router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;

    res.json({
      firstName: user.firstName,
      username: user.emailAddress,
    });

    res.status(200);
  })
);

router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      include: [{
        model: User,
      }, ],
    });
    res.status(200).json({
      courses
    });
  })
);

router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findAll({
      where: {
        id: req.params.id,
      },
      include: [{
        model: User,
      }, ],
    });
    res.status(200).json({
      course
    });
  })
);

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = req.body;
    user.password = bcryptjs.hashSync(user.password);
    await User.create(user);
    res.status(200).json({
      message: "success!"
    });
  })
);

router.post(
  "/courses",
  asyncHandler(async (req, res) => {
    const course = req.body;
    await Course.create(course);
    res.status(201).end();

  })
);

router.put('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.update(req.body, {
    where: {
      id: req.params.id,
    }
  });
  res.status(204).end();
}))

router.delete('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.destroy({
    where: {
      id: req.params.id,
    }
  });
  res.status(204).end();
}))

module.exports = router;