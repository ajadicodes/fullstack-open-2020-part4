const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const logger = require("../utils/logger");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body;
  const token = request.token;

  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({
      error: "token missing or invalid",
    });
  }

  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    ...body,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
  const token = request.token;

  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({
      error: "token missing or invalid",
    });
  }

  const user = await User.findById(decodedToken.id);

  // confirm if the blog requested has the same user id as the decoded token
  const blogIdQuery = { _id: request.params.id };
  const blog = await Blog.findOne(blogIdQuery);

  if (!user) {
    return response.status(401).send({
      error: "not a registered user",
    });
  }

  if (!blog) {
    return response.status(404).send({
      error: "blog not found",
    });
  }

  //
  if (blog.user._id.toString() === user._id.toString()) {
    await blog.deleteOne(blogIdQuery);
    return response.status(204).end();
  }

  response
    .status(401)
    .send({ error: "insufficient permission to delete blog" });
});

blogsRouter.put("/:id", async (request, response) => {
  const blogToUpdate = {
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes,
  };
  const updatedBlog = await Blog.findOneAndReplace(
    { _id: request.params.id },
    blogToUpdate,
    { returnOriginal: false }
  );
  response.json(updatedBlog);
});

module.exports = blogsRouter;
