const blogsRouter = require("express").Router();
const Blog = require("../models/blogs");
const logger = require("../utils/logger");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const blog = new Blog(request.body);
  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
  await Blog.deleteOne({ _id: request.params.id });
  response.status(204).end();
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
