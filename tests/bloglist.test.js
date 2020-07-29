const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helpers");
const api = supertest(app);
const Blog = require("../models/blog");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const blogsUrl = "/api/blogs";
const usersUrl = "/api/users";

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogList.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe("when there is initially some blogs saved", () => {
  test("blogs returned as JSON", async () => {
    await api
      .get(blogsUrl)
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
      .post(blogsUrl)
      .send(newBlogPost)
      .expect(200)
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
      .post(blogsUrl)
      .send(newBlogPost)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogsInDbAfterPost = await helper.blogsInDatabase();
    const likes = blogsInDbAfterPost.map((blog) => blog.likes);
    expect(likes).toContain(0);
  });

  test("returns 400 Bad Request when title and url are missing", async () => {
    const newBlogPost = {
      author: "FooBar",
      likes: 8,
    };

    const response = await api
      .post(blogsUrl)
      .send(newBlogPost)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(response.body.error).toContain("title / url cannot be missing");
  });
});

describe("deleting of a blog", () => {
  test("succeeds with status 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDatabase();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`${blogsUrl}/${blogToDelete.id}`).expect(204);

    // confirm that length of bloglist is reduced
    const blogsAfterDelete = await helper.blogsInDatabase();
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
        .put(`${blogsUrl}/${blogToUpdate.id}`)
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

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("secret", 10);
    const newUser = new User({
      username: "root",
      name: "Super User",
      passwordHash,
    });

    await newUser.save();
  });

  test("users are returned as json", async () => {
    await api
      .get(usersUrl)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("registering a user is succeeds", async () => {
    const usersBeforeRequest = await helper.usersInDatabase();

    const newUser = {
      username: "foobar",
      password: "secret",
      name: "Foo Bar",
    };

    await api
      .post(usersUrl)
      .send(newUser)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const usersAfterRequest = await helper.usersInDatabase();
    expect(usersAfterRequest).toHaveLength(usersBeforeRequest.length + 1);

    const userUsernames = usersAfterRequest.map((user) => user.username);
    expect(userUsernames).toContain(newUser.username);
  });

  describe("invalid user", () => {
    describe("username and password are required", () => {
      test("when both username and password are missing", async () => {
        const usersBeforeRegRequest = await helper.usersInDatabase();

        const newUser = {
          name: "Lagbaja Eleja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain(
          "username and password are required"
        );

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRegRequest.length);
      });

      test("when both username and password fields are empty", async () => {
        const usersBeforeRegRequest = await helper.usersInDatabase();

        const newUser = {
          username: "",
          password: "",
          name: "Lagbaja Eleja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain(
          "username and password are required"
        );

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRegRequest.length);
      });

      test("when username is missing but password field is empty", async () => {
        const usersBeforeRegRequest = await helper.usersInDatabase();

        const newUser = {
          password: "",
          name: "Lagbaja Eleja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain(
          "username and password are required"
        );

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRegRequest.length);
      });

      test("when password is missing but username field is empty", async () => {
        const usersBeforeRegRequest = await helper.usersInDatabase();

        const newUser = {
          usermame: "",
          name: "Lagbaja Eleja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain(
          "username and password are required"
        );

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRegRequest.length);
      });
    });

    describe("minimum length violation", () => {
      test("username is at least 3 characters long", async () => {
        const usersBeforeRequest = await helper.usersInDatabase();

        const newUser = {
          username: "la",
          password: "secret",
          name: "Lagbaja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain("username is too short");

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRequest.length);

        // verify that the new user is not in the database
        const usernamesBeforeRequest = usersBeforeRequest.map(
          (user) => user.username
        );
        expect(usernamesBeforeRequest).not.toContain(newUser.username);
      });

      test("password is at least 3 characters long", async () => {
        const usersBeforeRequest = await helper.usersInDatabase();

        const newUser = {
          username: "lagbaja",
          password: "se",
          name: "Lagbaja",
        };

        // expect post operation to return a 400 bad request or
        // 403 forbidden status code and a json that contains the error message
        const response = await api
          .post(usersUrl)
          .send(newUser)
          .expect(400)
          .expect("Content-Type", /application\/json/);

        // verify that the message contains a suitable error message
        expect(response.body.error).toContain("password is too short");

        // verify that the rejected user is not added to the database
        const usersAfterRegRequest = await helper.usersInDatabase();
        expect(usersAfterRegRequest).toHaveLength(usersBeforeRequest.length);

        // verify that the new user is not in the database
        const usernamesBeforeRequest = usersBeforeRequest.map(
          (user) => user.username
        );
        expect(usernamesBeforeRequest).not.toContain(newUser.username);
      });
    });

    test("username is unique", async () => {
      const usersBeforeRequest = await helper.usersInDatabase();

      const newUser = {
        username: "root",
        password: "someSecret",
        name: "Lagbaja",
      };

      // expect post operation to return a 400 bad request or
      // 403 forbidden status code and a json that contains the error message
      const response = await api
        .post(usersUrl)
        .send(newUser)
        .expect(400)
        .expect("Content-Type", /application\/json/);

      // verify that the message contains a suitable error message
      expect(response.body.error).toContain("username is already taken");

      // verify that the rejected user is not added to the database
      const usersAfterRegRequest = await helper.usersInDatabase();
      expect(usersAfterRegRequest).toHaveLength(usersBeforeRequest.length);

      // verify that the name is not in the database
      const namesBeforeRequest = usersBeforeRequest.map((user) => user.name);
      expect(namesBeforeRequest).not.toContain(newUser.name);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
