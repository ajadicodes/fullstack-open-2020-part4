const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helpers");

const api = supertest(app);
const blogUrl = "/api/blogs";
const Blog = require("../models/blogs");

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogList.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe("blog list", () => {
  test("returned as JSON", async () => {
    await api
      .get(blogUrl)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("unique identifier property is id", async () => {
    const blogsInDatabase = await helper.blogsInDatabase();
    const ids = blogsInDatabase.map((blog) => blog.id);
    expect(ids[0]).toBeDefined();
  });

  test("HTTP POST request is successful", async () => {
    const newBlogPost = {
      title: "Some foo bar blog",
      author: "Foo Bar",
      url: "https://www.example.com",
      likes: 9,
    };

    await api
      .post(blogUrl)
      .send(newBlogPost)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsInDbAfterPost = await helper.blogsInDatabase();
    expect(blogsInDbAfterPost).toHaveLength(helper.initialBlogList.length + 1);

    const authors = blogsInDbAfterPost.map((b) => b.author);
    expect(authors).toContain("Foo Bar");
  });

  test("defaults likes to 0 if likes is missing", async () => {
    const newBlogPost = {
      title: "Testing Likes",
      author: "FooBar",
      url: "https://www.example.com",
    };

    await api
      .post(blogUrl)
      .send(newBlogPost)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsInDbAfterPost = await helper.blogsInDatabase();
    const likes = blogsInDbAfterPost.map((blog) => blog.likes);
    expect(likes).toContain(0);
  });

  test("returns 400 Bad Request when title and url missing", async () => {
    const newBlogPost = {
      author: "FooBar",
      likes: 8,
    };

    await api.post(blogUrl).send(newBlogPost).expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
