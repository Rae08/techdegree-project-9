const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");
const User = require("../models").User;
const Course = require("../models").Course;
const {
  check,
  validationResult
} = require("express-validator/check");

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

// authenticate user middlewear
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
    res.status(401).json({
      message: "Access Denied",
    });
  }

  next();
});

// get user if authenticated
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


// get courses (no authentication needed)
router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      include: [{
        model: User,
        attributes: {
          exclude: ['password', 'createdAt', 'updatedAt']
        }
      }, ],
    });
    res.status(200).json({
      courses,
    });
  })
);

// get course (no authentication needed)
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findAll({
      where: {
        id: req.params.id,
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      include: [{
        model: User,
        attributes: {
          exclude: ['password', 'createdAt', 'updatedAt']
        }
      }, ],
    });
    if (course.length > 0) {
      res.status(200).json({
        course,
      });
    } else {
      res.status(400).json({
        message: "Oops! We can't find that course"
      })
    }
  }));

// post route to create new user
// requires firstName, lastName, emailAddress (unique), password 
router.post(
  "/users", [check("firstName")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "First Name"'),
    check("lastName")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Last Name"'),
    check("emailAddress")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Email Address"'),
    check("password")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Password"')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({
        errorMessages
      })
    } else {
      const user = req.body;
      user.password = bcryptjs.hashSync(user.password);
      await User.create(user);
      res.status(201).location('/').end();
    }
  })
);

// post route to create new course, requires authentication
// requires title and description
router.post(
  "/courses", authenticateUser, [check("title")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Title"'),
    check("description")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Description"')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({
        errorMessages
      })
    } else {
      const course = req.body;
      const newCourse = await Course.create(course);
      res.status(201).location(`/api/course/${newCourse.id}`).end();
    }

  })
);

// put route to update course
// must be logged in as the owner of the course
// requires title and desription
router.put(
  "/courses/:id", authenticateUser, [check("title")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Title"'),
    check("description")
    .exists({
      checkNull: true,
      checkFalsy: true
    })
    .withMessage('Please provide a value for "Description"')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({
        errorMessages
      })
    } else {
      const user = req.currentUser;
      const course = await Course.findAll({
        where: {
          id: req.params.id,
        },
      });

      if (course.length > 0) {
        if (user.id === course[0].dataValues.userId) {
          await Course.update(req.body, {
            where: {
              id: req.params.id,
            }
          })
          res.status(204).end();
        } else {
          res.status(403).json({
            message: "Oops! It looks like you do not own that course"
          })
        }
      } else {
        res.status(400).json({
          message: "Oops! We can't find that course"
        })
      }


    }

  })
);

// delete route to delete a course
// must be logged in as the owner of the course in order to delete
router.delete(
  "/courses/:id", authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const course = await Course.findAll({
      where: {
        id: req.params.id,
      },
    });

    if (course.length > 0) {
      if (user.id === course[0].dataValues.userId) {
        const course = await Course.destroy({
          where: {
            id: req.params.id,
          },
        });
        res.status(204).end();
      } else {
        res.status(403).json({
          message: "Oops! It looks like you do not own that course"
        })
      }
    } else {
      res.status(403).json({
        message: "Oops! We can't find that course"
      })
    }

  })
);

module.exports = router;