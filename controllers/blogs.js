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

  if (user) {
    const blog = new Blog({
      ...body,
      user: user._id,
    });

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    return response.json(savedBlog);
  }

  response
    .status(401)
    .send({ error: "you have not been authorised to make a post" });
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
    user: request.body.user,
    comments: request.body.comments,
  };
  const updatedBlog = await Blog.findOneAndReplace(
    { _id: request.params.id },
    blogToUpdate,
    { returnOriginal: false }
  );
  response.json(updatedBlog);
});

blogsRouter.put("/:id/comments", async (request, response) => {
  // finds the blog to comment on using the id
  // updates it by creating a completely new
  // object from the blog in the database.
  // The response after the operation is then returned
  // to the client to make use of.
  // I think i prefer this method compared to the above
  // approach used for updating likes because it helps
  // the the `view` to maintain a consistent state with
  // the server.
  // All one needs to send to the server is the `identifier`
  // and the update instead of sending a complete information.
  // For example, here now, all I needed to send in the
  // body of the request is the `blog id` and the
  // new comment.
  const blogIdQuery = { _id: request.params.id };
  const blog = await Blog.findOne(blogIdQuery);

  const newComment = request.body.newComment;
  const blogUpdate = {
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes,
    user: blog.user,
    comments: [...blog.comments, newComment],
  };

  console.log("blog update / comments", blogUpdate);

  const updatedBlog = await Blog.findOneAndReplace(
    { _id: request.params.id },
    blogUpdate,
    { returnOriginal: false }
  );

  response.json(updatedBlog);
});

module.exports = blogsRouter;
