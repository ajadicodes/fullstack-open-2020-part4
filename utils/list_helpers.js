const collection = require("lodash/collection");
const obj = require("lodash/object");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  if (blogs.length === 0) {
    return 0;
  }

  if (blogs.length === 1) {
    return blogs[0].likes;
  }

  const reducer = (sum, item) => {
    return sum + item;
  };

  const blogLikes = blogs.map((blog) => blog.likes);
  return blogLikes.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  const sortedByLikes = blogs.sort((blogA, blogB) => {
    if (blogA.likes > blogB.likes) {
      return 1;
    }
    if (blogA.likes == blogB.likes) {
      return 0;
    }
    if (blogA.likes < blogB.likes) {
      return -1;
    }
  });

  const { title, author, likes, ...others } = sortedByLikes[
    sortedByLikes.length - 1
  ];
  return { title, author, likes };
};

const mostBlogs = (blogs) => {
  // count number of blogs by each author
  const nBlogsByAuthor = collection.countBy(blogs, (b) => b.author);

  // get the author with the most number of blogs
  const authorWithMostBlogs = Object.keys(nBlogsByAuthor).reduce((a, b) =>
    nBlogsByAuthor[a] > nBlogsByAuthor[b] ? a : b
  );

  return {
    author: authorWithMostBlogs,
    blogs: nBlogsByAuthor[authorWithMostBlogs],
  };
};

const mostLikes = (blogs) => {
  const authorGroups = collection.groupBy(blogs, (blog) => blog.author);
  const reducer = (sum, item) => {
    return sum + item;
  };
  const nLikesByAuthor = obj.mapValues(authorGroups, (author) =>
    author.map((blog) => blog.likes).reduce(reducer, 0)
  );

  // get the author with the most likes
  const authorWithMostLikes = Object.keys(nLikesByAuthor).reduce((a, b) =>
    nLikesByAuthor[a] > nLikesByAuthor[b] ? a : b
  );

  return {
    author: authorWithMostLikes,
    likes: nLikesByAuthor[authorWithMostLikes],
  };
};

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes };
