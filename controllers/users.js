const usersRouter = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

// register a user
usersRouter.post("/", async (request, response, next) => {
  const body = request.body;
  const username = body.username;
  const name = body.name;
  const password = body.password;

  if (
    (!username && !password) ||
    (username.length === 0 && password.length === 0)
  ) {
    return response.status(400).send({
      error: "username and password are required",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  // run validation on username before password
  await user.validate();

  if (password.length < 3) {
    return response.status(400).send({
      error: "password is too short",
    });
  }

  const savedUser = await user.save();

  response.json(savedUser);
});

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs", {
    url: 1,
    title: 1,
    author: 1,
  });
  response.json(users);
});

usersRouter.get("/:id", async (request, response) => {
  const user = await User.findById(request.params.id);
  response.json(user);
});

module.exports = usersRouter;
