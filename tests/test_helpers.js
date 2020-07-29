const Blog = require("../models/blog");
const User = require("../models/user");

const initialBlogList = [
  {
    title: "React v16.13.0",
    author: "Sunil Pai",
    url: "https://www.reactjs.org",
    likes: 5,
  },
  {
    title: "Building Great User Experiences with Concurrent Mode and Suspense",
    author: "Joseph Savona",
    url: "https://www.ra.com",
    likes: 1,
    id: "5f1357fb6c387614ec651926",
  },
  {
    title: "Preparing for the Future with React Prereleases",
    author: "Andrew Clark",
    url: "https://www.lfc.com",
    likes: 20,
  },
];

const initialBlogCreators = {
  user_1: {
    username: "root",
    name: "Root",
    password: "root",
  },
  user_2: {
    username: "superroot",
    name: "Super Root",
    password: "superroot",
  },
};

const blogsInDatabase = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDatabase = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = { initialBlogList, blogsInDatabase, usersInDatabase };
