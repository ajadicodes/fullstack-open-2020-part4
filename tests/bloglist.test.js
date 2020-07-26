const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helpers");

const api = supertest(app);
const blogUrl = "/api/blogs";
const Blog = require("../models/blogs");
const { blogsInDatabase } = require("./test_helpers");

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogList.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});
describe("when there is initially some blogs saved", () => {
  test("blogs returned as JSON", async () => {
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
});

describe("addition of a new blog", () => {
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

describe("deleting of a blog", () => {
  test("succeeds with status 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDatabase();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`${blogUrl}/${blogToDelete.id}`).expect(204);

    // confirm that length of bloglist is reduced
    const blogsAfterDelete = await blogsInDatabase();
    expect(blogsAfterDelete).toHaveLength(helper.initialBlogList.length - 1);

    // confirm that the blog does not really exist
    const blogTitles = blogsAfterDelete.map((blog) => blog.title);
    expect(blogTitles).not.toContain(blogToDelete.title);
  });

  describe("updating a blog", () => {
    test("update was successful", async () => {
      const blogsBeforeUpdate = await helper.blogsInDatabase();
      const blogToUpdate = blogsBeforeUpdate[0];

      const blogUpdate = { ...blogToUpdate, likes: blogToUpdate.likes + 1 };

      // confirm that it returns the updated blog
      await api
        .put(`${blogUrl}/${blogToUpdate.id}`)
        .send(blogUpdate)
        .expect(200)
        .expect("Content-Type", /application\/json/)
        .expect(blogUpdate);

      const blogsAfterUpdate = await helper.blogsInDatabase();
      expect(blogsAfterUpdate[0].likes).toBe(blogToUpdate.likes + 1);

      // confirm that length of blogs saved in database remains same as
      // before update
      expect(blogsAfterUpdate).toHaveLength(blogsBeforeUpdate.length);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
